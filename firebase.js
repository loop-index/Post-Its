
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyCgOYVcyuVPdL9oqfL8o1DuCLaxcox_IU0",
authDomain: "post-its-ac7f8.firebaseapp.com",
projectId: "post-its-ac7f8",
storageBucket: "post-its-ac7f8.appspot.com",
messagingSenderId: "2102730298",
appId: "1:2102730298:web:f43f52d84e3666192d5f03"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
