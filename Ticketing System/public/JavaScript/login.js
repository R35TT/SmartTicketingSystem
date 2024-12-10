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

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

let confirmationResult;

// Set up reCAPTCHA
const recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
  "recaptcha-container",
  {
    size: "invisible",
    callback: () => {
      console.log("reCAPTCHA verified");
    },
  }
);

// Send OTP
document.getElementById("sendOtp").addEventListener("click", () => {
  const phoneNumberInput = document.getElementById("phoneNumber");
  let phoneNumber = phoneNumberInput.value.trim();

  // Validate and reformat the phone number
  phoneNumber = formatPhoneNumber(phoneNumber);

  if (!phoneNumber) {
    alert("Please enter a valid Philippine phone number in the format +639XXXXXXXXX.");
    return;
  }

  auth
    .signInWithPhoneNumber(phoneNumber, recaptchaVerifier)
    .then((result) => {
      confirmationResult = result;
      document.getElementById("login").style.display = "none";
      document.getElementById("verify").style.display = "flex";
      document.getElementById("info").style.display = "none";
      document.getElementById("otp").style.display = "inline-block";
      alert("OTP sent!");
    })
    .catch((error) => {
      console.error("Error during signInWithPhoneNumber", error);
      alert("Failed to send OTP: " + error.message);
    });
});

function formatPhoneNumber(number) {
  // Remove non-digit characters
  number = number.replace(/[^0-9]/g, "");

  if (number.startsWith("63") && number.length === 12) {
    return "+" + number; // Already in correct format
  } else if (number.startsWith("9") && number.length === 10) {
    return "+63" + number; // Add +63 if the user starts with 9
  } else if (number.startsWith("0") && number.length === 11) {
    return "+63" + number.slice(1); // Replace leading 0 with +63
  } else {
    return null; // Invalid format
  }
}

// Verify OTP
document.getElementById("verifyOtp").addEventListener("click", () => {
  const otp = document.getElementById("otp").value;
  confirmationResult
    .confirm(otp)
    .then((result) => {
      const user = result.user;
      alert("Phone number verified. Welcome, " + user.phoneNumber + "!");
      //auth.setCustomUserClaims("UID_OF_USER", { role: "user" });
      localStorage.setItem("userNumber", user.phoneNumber);
      window.location.href = "../Home.html";
    }) 
    .catch((error) => {
      console.error("Error verifying OTP", error);
      alert("Invalid OTP. Please try again.");
    });
});

// Resend OTP
document.getElementById("resendOtp").addEventListener("click", () => {
  const phoneNumber = document.getElementById("phoneNumber").value;
  auth
    .signInWithPhoneNumber(phoneNumber, recaptchaVerifier)
    .then((result) => {
      confirmationResult = result;
      alert("OTP resent!");
    })
    .catch((error) => {
      console.error("Error during resend", error);
      alert("Failed to resend OTP: " + error.message);
    });
});
