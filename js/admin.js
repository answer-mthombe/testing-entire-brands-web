// Firebase configuration (same as your order form)
const firebaseConfig = {
    apiKey: "AIzaSyAFj1IynoPiIOfuKMd-fehxhHyAuZMw69Q",
    authDomain: "entire-brands.firebaseapp.com",
    projectId: "entire-brands",
    storageBucket: "entire-brands.appspot.com",
    messagingSenderId: "615706085484",
    appId: "1:615706085484:web:ea416c9cfc22851ba47049",
    measurementId: "G-4VHQXDYPEN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM elements
const ordersTableBody = document.getElementById('ordersTableBody');
const totalOrdersEl = document.getElementById('totalOrders');
const completedOrdersEl = document.getElementById('completedOrders');
const pendingOrdersEl = document.getElementById('pendingOrders');
const refreshOrdersBtn = document.getElementById('refreshOrders');
const logoutBtn = document.getElementById('logoutBtn');
const dropdownLogout = document.getElementById('dropdownLogout');
const sidebarToggle = document.getElementById('sidebarToggle');
const orderDetailsModal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
const saveStatusBtn = document.getElementById('saveStatusBtn');
const emailClientModal = new bootstrap.Modal(document.getElementById('emailClientModal'));
const sendEmailBtn = document.getElementById('sendEmailBtn');
const openGmailBtn = document.getElementById('openGmailBtn');
const emailTo = document.getElementById('emailTo');
const emailSubject = document.getElementById('emailSubject');
const emailMessage = document.getElementById('emailMessage');

// Variables
let orders = [];
let currentOrderId = null;
let dataTable;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    loadOrders();
});

function checkAuth() {
    // In a real app, you would implement proper authentication
    // For this example, we'll just proceed
}

function setupEventListeners() {
    // Sidebar toggle
    sidebarToggle.addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('active');
    });

    // Refresh orders
    refreshOrdersBtn.addEventListener('click', loadOrders);

    // Logout buttons
    logoutBtn.addEventListener('click', logout);
    dropdownLogout.addEventListener('click', logout);

    // Filter options
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const filter = this.getAttribute('data-filter');
            filterOrders(filter);
        });
    });

    // Save status button
    saveStatusBtn.addEventListener('click', updateOrderStatus);
    // Email buttons
    sendEmailBtn.addEventListener('click', sendEmail);
    openGmailBtn.addEventListener('click', openInGmail);
}

function loadOrders() {
    db.collection("orders").orderBy("timestamp", "desc").get()
        .then((querySnapshot) => {
            orders = [];
            querySnapshot.forEach((doc) => {
                const order = doc.data();
                order.id = doc.id;
                orders.push(order);
            });
            renderOrders();
            updateStats();
        })
        .catch((error) => {
            console.error("Error getting orders: ", error);
            alert("Error loading orders. Please try again.");
        });
}

function renderOrders() {
    ordersTableBody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        
        // Format date
        const orderDate = order.timestamp ? order.timestamp.toDate() : new Date();
        const formattedDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Determine status
        const status = order.status || 'pending';
        let statusClass = 'status-pending';
        let statusText = 'Pending';
        
        if (status === 'processing') {
            statusClass = 'status-processing';
            statusText = 'Processing';
        } else if (status === 'completed') {
            statusClass = 'status-completed';
            statusText = 'Completed';
        }
        
        row.innerHTML = `
            <td>${order.id.substring(0, 8)}...</td>
            <td>${order.name}</td>
            <td>${order.company || 'N/A'}</td>
            <td>${order.service || 'Not specified'}</td>
            <td>${formattedDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-order" data-id="${order.id}">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
        
        ordersTableBody.appendChild(row);
    });
    
    // Initialize DataTable if not already initialized
    if (!dataTable) {
        dataTable = $('#ordersTable').DataTable({
            responsive: true,
            columnDefs: [
                { responsivePriority: 1, targets: 0 },
                { responsivePriority: 2, targets: 1 },
                { responsivePriority: 3, targets: 5 }
            ]
        });
    } else {
        dataTable.destroy();
        dataTable = $('#ordersTable').DataTable({
            responsive: true
        });
    }
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-order').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            showOrderDetails(orderId);
        });
    });
}

function filterOrders(status) {
    if (status === 'all') {
        dataTable.search('').columns().search('').draw();
        return;
    }
    
    dataTable.column(5).search(status, true, false).draw();
}

function showOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    currentOrderId = orderId;
    
    // Format date
    const orderDate = order.timestamp ? order.timestamp.toDate() : new Date();
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Determine current status
    const currentStatus = order.status || 'pending';
    
    document.getElementById('orderDetailsContent').innerHTML = `
        <div class="row mb-4">
            <div class="col-md-6">
                <h6>Order Information</h6>
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Service:</strong> ${order.service || 'Not specified'}</p>
            </div>
            <div class="col-md-6">
                <h6>Client Information</h6>
                <p><strong>Name:</strong> ${order.name}</p>
                <p><strong>Company:</strong> ${order.company || 'N/A'}</p>
                <p><strong>Email:</strong> <a href="mailto:${order.email}">${order.email}</a></p>
                <p><strong>Phone:</strong> <a href="tel:${order.phone}">${order.phone}</a></p>
            </div>
        </div>
        
        <div class="mb-4">
            <h6>Project Details</h6>
            <div class="card bg-light p-3">
                ${order.details || 'No details provided'}
            </div>
        </div>
        
        <div class="mb-3">
            <h6>Status</h6>
            <select class="form-select" id="statusSelect">
                <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="processing" ${currentStatus === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
        </div>
        
        
        
        <div class="d-flex justify-content-between mt-4">
            <button class="btn btn-outline-secondary" id="copyOrderDetails">
                <i class="fas fa-copy me-2"></i>Copy Details
            </button>
            <button class="btn btn-outline-primary" id="emailClientBtn">
                <i class="fas fa-envelope me-2"></i>Email Client
            </button>
        </div>
    `;
    
    // Add clickable email and phone links
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.addEventListener('click', (e) => e.stopPropagation());
    });
    
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        link.addEventListener('click', (e) => e.stopPropagation());
    });
    
    // Add copy details functionality
    document.getElementById('copyOrderDetails').addEventListener('click', () => {
        const orderText = `Order ID: ${order.id}
Client: ${order.name}
Company: ${order.company || 'N/A'}
Email: ${order.email}
Phone: ${order.phone}
Service: ${order.service || 'Not specified'}
Date: ${formattedDate}
Details: ${order.details || 'None'}`;
        
        navigator.clipboard.writeText(orderText)
            .then(() => alert('Order details copied to clipboard!'))
            .catch(err => console.error('Failed to copy: ', err));
    });
    
    // Add email client functionality
    document.getElementById('emailClientBtn').addEventListener('click', () => {
        prepareEmail(order);
        orderDetailsModal.hide();
    });
    
    orderDetailsModal.show();
}
function updateOrderStatus() {
    const status = document.getElementById('statusSelect').value;
    const adminNotes = document.getElementById('adminNotes').value;
    
    db.collection("orders").doc(currentOrderId).update({
        status: status,
        adminNotes: adminNotes,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Order updated successfully!');
        orderDetailsModal.hide();
        loadOrders();
    })
    .catch((error) => {
        console.error("Error updating order: ", error);
        alert("Error updating order. Please try again.");
    });
}

function updateStats() {
    totalOrdersEl.textContent = orders.length;
    
    const completed = orders.filter(o => o.status === 'completed').length;
    completedOrdersEl.textContent = completed;
    
    const pending = orders.filter(o => !o.status || o.status === 'pending').length;
    pendingOrdersEl.textContent = pending;
}

function logout() {
    // In a real app, you would sign out the user
    // For this example, we'll just redirect
    window.location.href = 'index.html';
}
function prepareEmail(order) {
    emailTo.value = order.email;
    
    // Pre-fill subject with order info
    emailSubject.value = `Regarding Your ${order.service || 'Order'} (${order.id.substring(0, 8)})`;
    
    // Pre-fill message with order details
    let message = `Dear ${order.name},\n\n`;
    message += `Thank you for your order with Entire Brands.\n\n`;
    message += `We are currently processing your request for:\n`;
    message += `Service: ${order.service || 'Not specified'}\n`;
    message += `Order ID: ${order.id}\n\n`;
    message += `Project Details:\n${order.details || 'No details provided'}\n\n`;
    message += `If you have any questions, please don't hesitate to contact us.\n\n`;
    message += `Best regards,\nEntire Brands Team`;
    
    emailMessage.value = message;
    emailClientModal.show();
}

function sendEmail() {
    // In a real implementation, you would use a server-side email service
    // For this demo, we'll just show a confirmation
    alert(`Email would be sent to: ${emailTo.value}\n\nSubject: ${emailSubject.value}\n\nMessage: ${emailMessage.value}`);
    emailClientModal.hide();
}

function openInGmail() {
    const subject = encodeURIComponent(emailSubject.value);
    const body = encodeURIComponent(emailMessage.value);
    const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailTo.value}&su=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
}