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

async function displayParkingHistory() {
  const phoneNumber = localStorage.getItem("userNumber");
  console.log(phoneNumber);
  try {
    const historyContainer = document.getElementById("history");
    const receiptContainer = document.getElementById("receipt"); // Container for the receipt
    receiptContainer.style.display = "none"; // Initially hide the receipt container

    // Query the 'history' subcollection within the user's document
    const userDocRef = db.collection("users").doc(phoneNumber); // Reference to the user's document
    const historyCollectionRef = userDocRef.collection("history"); // Reference to the history subcollection
    const querySnapshot = await historyCollectionRef
      .orderBy("departureTime", "desc")
      .get();

    if (querySnapshot.empty) {
      historyContainer.innerHTML = "<p>No parking history found.</p>";
      return;
    }

    querySnapshot.forEach((doc) => {
      const historyItem = doc.data();

      const historyDiv = document.createElement("div");
      historyDiv.classList.add("info");

      historyDiv.innerHTML = `
          <p>Fee: ${historyItem.fee}</p>
          <p>Time In: ${historyItem.arrivalTime}</p>
          <p>Time Out: ${historyItem.departureTime}</p>
          <p>Status: ${historyItem.status || "N/A"}</p> 
          <button class="viewBtn btn" style="width:18rem; margin-bottom:1rem" data-ticket-number="${
            historyItem.ticketNumber
          }">View Ticket</button>
          <hr>
        `;
      historyContainer.appendChild(historyDiv);
    });

    // Add event listeners to the "View Ticket" buttons *after* they are created
    const viewButtons = document.querySelectorAll(".viewBtn");
    viewButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const ticketNumber = button.dataset.ticketNumber;
        console.log("View ticket:", ticketNumber);
        historyContainer.style.display = "none"; // Hide history container
        await viewTicketDetails(ticketNumber); // Call function to display ticket details
      });
    });
  } catch (error) {
    console.error("Error fetching parking history:", error);
    historyContainer.innerHTML = `<p>An error occurred while fetching history: ${error.message}</p>`;
  }
}

// Function to view ticket details
async function viewTicketDetails(ticketNumber) {
  const phoneNumber = localStorage.getItem("userNumber");
  const receiptContainer = document.getElementById("receipt");
  const historyContainer = document.getElementById("history");

  try {
    const userDocRef = db.collection("users").doc(phoneNumber);
    const historyCollectionRef = userDocRef.collection("history");
    const ticketDoc = await historyCollectionRef
      .where("ticketNumber", "==", ticketNumber)
      .get();

    if (!ticketDoc.empty) {
      const ticketData = ticketDoc.docs[0].data(); // Get the first matching document

      // Populate the receipt container with styled HTML
      receiptContainer.innerHTML = `
        <div class="receipt-container">
          <div class="receipt-header">
            <img src="UI/Smart Ticketing Logo (without White).png" alt="Logo" class="receipt-logo">
            <h2>DIGITAL PARKING RECEIPT</h2>
          </div>
          <div class="receipt-section">
            <h3>Parking Details</h3>
            <p><strong>Vehicle Type:</strong> ${
              ticketData.vehicleType || "N/A"
            }</p>
            <p><strong>Floor Level:</strong> ${
              ticketData.floorNumber || "N/A"
            }</p>
            <p><strong>Start:</strong> ${ticketData.arrivalTime || "N/A"}</p>
            <p><strong>End:</strong> ${ticketData.departureTime || "N/A"}</p>
            <p><strong>Duration:</strong> ${ticketData.duration || "N/A"}</p>
          </div> 
          <div class="receipt-section">
            <h3>Payment Method</h3>
            <p><strong>Payment Method:</strong> CASH</p>
          </div>
          <div class="receipt-section"> 
            <h3>Payment Summary</h3>
            <p><strong>Pay:</strong> PHP ${ticketData.fee || "N/A"}</p>
          </div> 
          <p class="receipt-footer">THANK YOU AND DRIVE SAFELY!</p>
          <button id="closeReceipt" class="btn" style="background-color: white; color: black;">Done</button>
        </div>
      `;
      receiptContainer.style.display = "block"; // Show the receipt container

      // Close receipt button functionality
      const closeReceiptButton = document.getElementById("closeReceipt");
      closeReceiptButton.addEventListener("click", () => {
        receiptContainer.style.display = "none"; // Hide receipt container
        historyContainer.style.display = "block"; // Unhide the history container
      });
    } else {
      console.log("No ticket found for the provided ticket number.");
    }
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    receiptContainer.innerHTML = `<p>An error occurred while fetching ticket details: ${error.message}</p>`;
    receiptContainer.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", displayParkingHistory);
