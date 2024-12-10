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
const db = firebase.firestore(app);

let parkStartTime;
let timerInterval = null;
let countdownInterval = null; // Track the interval for updating time

async function renderParkingSessionData() {
  let parkingSessionData = await fetchParkingSessionData();
  parkingSessionData = parkingSessionData.data;

  console.log(parkingSessionData);

  const parkDateEl = document.getElementById("parkDate");
  const parkTimeEl = document.getElementById("parkTime");
  const qrImageEl = document.getElementById("generatedQR");
  const vehicleTypeEl = document.getElementById("vehicleType");
  const flrNumberEl = document.getElementById("flrNum");
  const deleteButton = document.getElementById("deleteSessionBtn");

  // Display the parking session data
  qrImageEl.src = parkingSessionData.qrCodeLink;
  vehicleTypeEl.textContent = parkingSessionData.vehicleType;
  flrNumberEl.textContent = parkingSessionData.floorNumber;

  if (!parkingSessionData || !parkingSessionData) {
    // No timer start for "data" status
    alert("Generate a Session first in the homepage");
    document.getElementById("timeInterval").textContent = "Pending";
    document.getElementById("price").textContent = "Pending";
    document.getElementById("parkDate").textContent = "N/A";
    document.getElementById("parkTime").textContent = "N/A";
    document.getElementById("vehicleType").textContent = "Vehicle Type";
    document.getElementById("flrNum").textContent = "Floor Number";
    document.getElementById("timeInterval").textContent = "00:00:00";
    document.getElementById("generatedQR").src =
      "/UI/Smart Ticketing Logo (without White).png"; // Clear or set a default image
    document.getElementById("generatedQR").alt = "No QR Code Available";
    localStorage.removeItem("countdownEndTime");
  }

  if (parkingSessionData.status === "Payment Successful") {
    clearInterval(timerInterval);
    timerInterval = null;
    localStorage.removeItem("countdownEndTime");
    alert("Payment Successful! Please proceed to the Exit");
    return;
  }
  // Check session status
  if (parkingSessionData.status === "Complete") {

    // Update UI elements
    document.getElementById("timeInterval").textContent = "Session Complete";
    document.getElementById("price").textContent = "0";

    // Delete the parking session from the database
    console.log(parkingSessionData.userNumber);
    await deleteParkingSession(parkingSessionData.userNumber);
    alert("Thankyou, please come again.");
    return;
  }

  // If status is "Success", start the timer
  if (parkingSessionData.status === "Success") {
    // Continue rendering session and start the timer
    parkStartTime = new Date(parkingSessionData.arrivalTime);
    localStorage.removeItem("countdownEndTime");
    startTimer();
  }

  // If the session is pending, just render QR and vehicle details without starting the timer
  if (parkingSessionData.status === "pending") {
    // No timer start for "Pending" status
    startCountdown(1 * 60, parkingSessionData.userNumber); // Start a 15-minute timer
    deleteButton.style.display = "block";
  } 

  // Format date and time
  const dateObj = new Date(parkingSessionData.arrivalTime);
  const optionsDate = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDate = dateObj.toLocaleDateString(undefined, optionsDate);

  const optionsTime = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  const formattedTime = dateObj.toLocaleTimeString(undefined, optionsTime);

  parkDateEl.textContent = formattedDate;
  parkTimeEl.textContent = formattedTime;
}

async function fetchParkingSessionData() {
  const mobileNumber = localStorage.getItem("userNumber");

  try {
    document.getElementById("loadingOverlay").style.display = "flex";

    const response = await fetch(
      `https://app-4547xlrdnq-uc.a.run.app/api/get/parkingSession/${mobileNumber}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data; // Return the parsed JSON data
  } catch (error) {
    console.error("Fetch Error:", error);
    //showErrorUI("Generate a Parking Session first");
  } finally {
    document.getElementById("loadingOverlay").style.display = "none";
  }
}

async function deleteParkingSession(userNumber) {
  const mobileNumber = localStorage.getItem("userNumber");
  try {
    const parkingSessionData = await fetchParkingSessionData();
    if (parkingSessionData && parkingSessionData.data) {
      const floor = parkingSessionData.data.floorNumber;
      const vehicleType = parkingSessionData.data.vehicleType;
      await incrementAvailableSlots(floor, vehicleType); // Increment slots after deleting session
    } else {
      console.error(
        "Could not retrieve parking session data for incrementing slots."
      );
    }
    const response = await fetch(
      `https://app-4547xlrdnq-uc.a.run.app/api/delete/parkingSession/${mobileNumber}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error deleting parking session: ${response.status}`);
    }
    document.getElementById(deleteSessionBtn).style.display = 'none';
    localStorage.removeItem("countdownEndTime");
    console.log(`Parking session for user ${userNumber} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting parking session:", error);
  }
}
async function incrementAvailableSlots(floor, vehicleType) {
  try {
    const docRef = db.collection("parkingSlots").doc(floor);
    const doc = await docRef.get();

    if (doc.exists) {
      const parkingData = doc.data();
      let availableSlots = parkingData[vehicleType];

      if (typeof availableSlots === "number") {
        availableSlots++; // Increment available slots
        await docRef.update({ [vehicleType]: availableSlots }); // Update in Firestore
        console.log(
          `Incremented ${vehicleType} slots on floor ${floor} to ${availableSlots}`
        );
      } else {
        console.error(
          `Invalid slot data for ${vehicleType} on floor ${floor}:`,
          availableSlots
        );
      }
    } else {
      console.error(
        `No parking slot data found for floor ${floor} in Firestore.`
      );
    }
  } catch (error) {
    console.error("Error incrementing available slots:", error);
  }
}

function showErrorUI(message) {
  const errorContainer = document.createElement("div");
  errorContainer.id = "errorUI";
  errorContainer.textContent = message;
  errorContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
    padding: 1.5rem;
    border-radius: 0.5rem;
    z-index: 1001;
    font-family: sans-serif;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    text-align: center;
  `;
  document.body.appendChild(errorContainer);
}

function startTimer() {
  // Clear any existing timer to avoid multiple intervals
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(updateElapsedTime, 1000);
}

function updateElapsedTime() {
  if (!parkStartTime) {
    console.error("parkStartTime is not defined yet");
    return;
  }

  const currentTime = new Date();
  const elapsedTime = new Date(currentTime - parkStartTime);

  // Format elapsed time in HH:MM:SS
  const hours = elapsedTime.getUTCHours() + (elapsedTime.getUTCDate() - 1) * 24;
  const minutes = elapsedTime.getUTCMinutes().toString().padStart(2, "0");
  const seconds = elapsedTime.getUTCSeconds().toString().padStart(2, "0");

  document.getElementById(
    "timeInterval"
  ).textContent = `${hours}:${minutes}:${seconds}`;

  const totalFee = calculateFee(elapsedTime);
  document.getElementById("price").textContent = totalFee;
}

function calculateFee(elapsedTime) {
  const hoursParked = Math.ceil(elapsedTime / (1000 * 60 * 60));

  // Fee Structure
  const baseHours = 4;
  const baseRate = 50;
  const additionalHourlyRate = 30;

  let totalFee = baseRate; // Start with the base rate
  if (hoursParked > baseHours) {
    const additionalHours = hoursParked - baseHours;
    totalFee += additionalHours * additionalHourlyRate;
  }

  return totalFee;
}
function startCountdown(duration, userNumber) {
  const timerDisplay = document.getElementById("timeInterval");

  // Check if there's a saved end time in localStorage
  const savedEndTime = localStorage.getItem("countdownEndTime");

  let remainingTime;
  if (savedEndTime) {
    const now = new Date().getTime();
    remainingTime = Math.floor((new Date(savedEndTime) - now) / 1000);

    // If the saved countdown is already expired
    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      alert("Time expired! Deleting your parking session.");
      deleteParkingSession(userNumber);
      resetUI();
      localStorage.removeItem("countdownEndTime");
      return;
    }
  } else {
    remainingTime = duration;
    const endTime = new Date().getTime() + remainingTime * 1000;
    localStorage.setItem("countdownEndTime", new Date(endTime).toISOString());
  }

  countdownInterval = setInterval(async () => {
    const minutes = Math.floor(remainingTime / 60).toString().padStart(2, "0");
    const seconds = (remainingTime % 60).toString().padStart(2, "0");

    timerDisplay.textContent = `${minutes}:${seconds}`;
    remainingTime--;

    // If time runs out, delete the parking session
    if (remainingTime < 0) {
      clearInterval(countdownInterval);
      alert("Time expired! Deleting your parking session.");
      await deleteParkingSession(userNumber);
      resetUI();
      localStorage.removeItem("countdownEndTime"); // Clean up
    }
  }, 1000);
}function resetUI() {
  document.getElementById("timeInterval").textContent = "00:00:00";
  document.getElementById("price").textContent = "Pending";
  document.getElementById("parkDate").textContent = "N/A";
  document.getElementById("parkTime").textContent = "N/A";
  document.getElementById("vehicleType").textContent = "Vehicle Type";
  document.getElementById("flrNum").textContent = "Floor Number";
  document.getElementById("generatedQR").src =
    "/UI/Smart Ticketing Logo (without White).png"; // Default image
  document.getElementById("generatedQR").alt = "No QR Code Available";
}
document.getElementById("deleteSessionBtn").addEventListener("click", async () => {
  const confirmDelete = confirm(
    "Are you sure you want to delete your parking session?"
  );
  if (confirmDelete) {
    const mobileNumber = localStorage.getItem("userNumber");
    await deleteParkingSession(mobileNumber);
    alert("Parking session deleted successfully.");
    resetUI();
  }
});
// Initialize parking session data on page load
window.onload = renderParkingSessionData;
