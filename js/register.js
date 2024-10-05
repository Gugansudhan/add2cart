// Import and configure Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w",
    authDomain: "ecommerce-43f8f.firebaseapp.com",
    projectId: "ecommerce-43f8f",
    storageBucket: "ecommerce-43f8f.appspot.com",
    messagingSenderId: "1048753551923",
    appId: "1:1048753551923:web:dabbfcd94e4d35a92bc146",
    measurementId: "G-LLZLYR6S5F" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(function () {
    messageDiv.style.opacity = 0;
  }, 5000);
}

// Function to get the next available ID from Firestore
async function getNextUserId() {
  const idDocRef = doc(db, 'ids', 'userId');
  const idDoc = await getDoc(idDocRef);

  if (idDoc.exists()) {
    let currentId = idDoc.data().currentId;
    await updateDoc(idDocRef, {
      currentId: currentId + 1
    });
    return currentId + 1;
  } else {
    // If the document does not exist, create it and start from 1
    await setDoc(idDocRef, {
      currentId: 1
    });
    return 1;
  }
}

// Register function
async function register() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const mobile = document.getElementById('reg-mobile').value;

  if (!name || !email || !password || !mobile) {
    showMessage('All fields are required!', 'registerMessage');
    return;
  }

  // Get the next user ID
  const newUserId = await getNextUserId();

  // Create user with email and password in Firebase Authentication
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Store user details in Firestore with a default creditLimit of 0
      const userData = {
        userid: newUserId,    // Sequentially set the ID
        name: name,
        email: email,
        mobile: mobile,
        creditLimit: 0,   // Default creditLimit
        createdAt: new Date().toISOString()
      };

      // Store user data in Firestore
      const docRef = doc(db, "users", user.uid); // Firebase's UID for the document
      setDoc(docRef, userData)
        .then(() => {
          showMessage('Account Created Successfully!', 'registerMessage');
          // Redirect to login page or dashboard after success
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          showMessage('Failed to save user data!', 'registerMessage');
        });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Error during registration:', errorMessage);

      if (errorCode === 'auth/email-already-in-use') {
        showMessage('Email already in use!', 'registerMessage');
      } else {
        showMessage('Failed to create account: ' + errorMessage, 'registerMessage');
      }
    });
}

// Make the register function globally accessible
window.register = register;
