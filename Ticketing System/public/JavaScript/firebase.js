const firebaseConfig = {
  apiKey: "AIzaSyD2FEVvszIWkqSLIqMkT0Z_L3C4YbXphl4",
  authDomain: "smart-ticketing-system-5b98e.firebaseapp.com",
  databaseURL:
    "https://smart-ticketing-system-5b98e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-ticketing-system-5b98e",
  storageBucket: "smart-ticketing-system-5b98e.firebasestorage.app",
  messagingSenderId: "195567199205",
  appId: "1:195567199205:web:d74172600a799fa19d050c",
  measurementId: "G-2329G4EM18",
};
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app); // Initialize and export Firestore
const auth = firebase.auth(); // Initialize and export auth

export { db, auth }; // Export db and auth
