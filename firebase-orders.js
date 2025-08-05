// Firebase config
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
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Submit function
async function submitOrder(event) {
  event.preventDefault();
  
  // Basic form validation
  if (!document.getElementById("agreeTerms").checked) {
    alert("Please agree to the terms and conditions");
    return;
  }

  const submitBtn = document.querySelector('#orderFormFirebase button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    // Get form values
    const formData = {
      name: document.getElementById("name").value,
      company: document.getElementById("company").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      details: document.getElementById("details").value,
      service: document.getElementById("selectedService").value, // Service selection
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    await db.collection("orders").add(formData);
    
    alert("Order submitted successfully!");
    document.getElementById("orderFormFirebase").reset();
  } catch (error) {
    console.error("Error:", error);
    alert("Error submitting: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Order';
  }
}

// Attach event listener
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById("orderFormFirebase");
  
  if (!form) {
    console.error("FORM NOT FOUND! Check your form ID");
    return;
  }
  
  form.addEventListener("submit", submitOrder);
});