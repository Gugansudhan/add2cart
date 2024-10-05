// Import Firebase SDK functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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

// Show message in HTML
function showMessage(message, divId) {
    const messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(function () {
        messageDiv.style.opacity = 0;
    }, 5000);
}

// Google Sign-In function
function googleSigninBtn(event) {
    event.preventDefault(); // Prevent default form submission

    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;

            // Check if user is already registered in Firestore
            const userRef = doc(db, "users", user.uid);
            setDoc(userRef, {
                email: user.email,
                firstName: user.displayName,
                creditLimit: 0 // default credit limit
            }, { merge: true }); // Merge if the user already exists

            showMessage('Google Sign-In Successful', 'signInMessage');
            localStorage.setItem('loggedInUserId', user.uid);
            window.location.href = 'homepage.html'; // Redirect to homepage
        })
        .catch((error) => {
            console.error('Error during Google Sign-In:', error);
            showMessage('Failed to sign in with Google: ' + error.message, 'signInMessage');
        });
}

// Email/Password Login
// const emailLoginBtn = document.getElementById('emailLoginBtn');
// emailLoginBtn.addEventListener('click', () => {
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;

//     signInWithEmailAndPassword(auth, email, password)
//         .then((userCredential) => {
//             const user = userCredential.user;
//             showMessage('Login successful!', 'signInMessage');
//             localStorage.setItem('loggedInUserId', user.uid);
//             window.location.href = 'homepage.html';
//         })
//         .catch((error) => {
//             const errorCode = error.code;
//             if (errorCode === 'auth/wrong-password') {
//                 showMessage('Incorrect email or password', 'signInMessage');
//             } else if (errorCode === 'auth/user-not-found') {
//                 showMessage('User not found', 'signInMessage');
//             } else {
//                 showMessage('Login failed: ' + error.message, 'signInMessage');
//             }
//         });
// });

// Add event listener for Google Sign-In button
const googleSigninBtnElement = document.getElementById('googleSigninBtn');
googleSigninBtnElement.addEventListener('click', googleSigninBtn);
