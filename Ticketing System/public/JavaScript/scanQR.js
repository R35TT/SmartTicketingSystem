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

const inputField = document.getElementById("barcodeInput");
const qrInput = document.getElementById("qrScan");

window.onload = async () => {
  await populateFloorsDropdown(); 
  const floor = document.getElementById("floorLvl").value;
  const vehicleType = document.getElementById("vehicleType").value;
  await updateButtonState(floor, vehicleType); // Initialize button state on load
};

async function populateFloorsDropdown() {
  const floorDropdown = document.getElementById("floorLvl");

  try {
    const snapshot = await db.collection("parkingSlots").get();

    if (snapshot.empty) {
      console.warn("No floors found in the database.");
      return;
    }

    // Populate dropdown with floors
    let firstFloorSet = false;
    snapshot.forEach((doc) => {
      const floor = doc.id; // Document ID is the floor number
      const option = document.createElement("option");
      option.value = floor;
      option.textContent = floor; // Display the floor number as text
      floorDropdown.appendChild(option);

      // Automatically select the first floor as default
      if (!firstFloorSet) {
        floorDropdown.value = floor;
        firstFloorSet = true;
      }
    });

    console.log("Floors dropdown populated.");

    // Automatically populate vehicle types for the first floor
    const firstFloor = floorDropdown.value; // Selected floor is now the first value
    await populateVehicleTypesDropdown(firstFloor);
  } catch (error) {
    console.error("Error fetching floors:", error);
  }
}


// Function to populate the vehicle types dropdown
async function populateVehicleTypesDropdown(floor) {
  const vehicleDropdown = document.getElementById("vehicleType");
  vehicleDropdown.innerHTML = ""; // Clear existing options 

  try {
    const docRef = db.collection("parkingSlots").doc(floor);
    const doc = await docRef.get();

    if (doc.exists) {
      const vehicleTypes = Object.keys(doc.data()); // Get keys as vehicle types

      // Dynamically create options based on available vehicle types
      vehicleTypes.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize first letter
        vehicleDropdown.appendChild(option);
      });

      console.log(`Vehicle types dropdown populated for Floor ${floor}.`);
    } else {
      console.warn(`No data found for Floor ${floor}.`);
    }
  } catch (error) {
    console.error(`Error fetching vehicle types for Floor ${floor}:`, error);
  }
}

async function updateButtonState(floor, vehicleType) {

  try {
    // Fetch available slots
    const docRef = db.collection("parkingSlots").doc(floor);
    const doc = await docRef.get();

    if (doc.exists) {
      const parkingData = doc.data();
      const availableSlots = parkingData[vehicleType];

      // Display available slots
      document.getElementById("availableSlot").textContent = availableSlots;

    } else {
      console.warn("No document found for this floor.");
      generateButton.disabled = true; // Disable the button if no data is found
    }
  } catch (error) {
    console.error("Error fetching slot data:", error);
    generateButton.disabled = true; // Disable the button in case of error
  }
}

// Add event listeners for dropdown changes
document.getElementById("floorLvl").addEventListener("change", async () => {
  const floor = document.getElementById("floorLvl").value;

  // Populate vehicle types dropdown for the selected floor
  await populateVehicleTypesDropdown(floor);

  // Update button state after changing floor and vehicle type
  const vehicleType = document.getElementById("vehicleType").value;
  await updateButtonState(floor, vehicleType);
});

document.getElementById("vehicleType").addEventListener("change", async () => {
  const floor = document.getElementById("floorLvl").value;
  const vehicleType = document.getElementById("vehicleType").value;
  await updateButtonState(floor, vehicleType);
});

inputField.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    processInput(); // Process the input when Enter is pressed
  }
});

async function processInput() {
  const scannedData = inputField.value.trim();

  if (scannedData === "") {
    console.log("Empty input field");
    alert("Please enter data."); // Alert for empty input
  } else {
    console.log("Processed Input:", scannedData);
    qrInput.value = "";
    qrInput.style.display = "none";

    // Validate and handle the vehicle type
    const action = await preCheckVehicleType(scannedData);
    if (action === "update") {
      await updateHistory(scannedData); // Update history if verified
    } else if (action === "delete") {
      await deleteParkingSession(scannedData); // Delete parking session if not verified
    }
  }
  inputField.value = ""; // Clear the input field *after* processing
}

async function preCheckVehicleType(scannedData) {
  if (!isValidJSON(scannedData)) {
    alert("Invalid QR Code Data. Please scan a valid QR code.");
    inputField.focus();
    return false;
  }

  const data = JSON.parse(scannedData);
  const { vehicleType, userNumber } = data;

  if (vehicleType === "PWD" || vehicleType === "Senior") {
    // Notify attendant to validate the ID
    const proceed = confirm(
      `Vehicle type is '${vehicleType}'. Please validate the user ID manually.\nClick OK to confirm validation, or Cancel to assign a new floor and vehicle type.`
    );

    if (proceed) {
      // If confirmed, return "update" to proceed with updating
      return "update";
    } else {
      alert("Validation failed. The session will be deleted.");
      return "delete"; // Return "delete" to trigger the deletion process
    }
  }

  return "update"; // Default action if no special handling is needed
}

async function deleteParkingSession(scannedData) {
  try {
    if (!isValidJSON(scannedData)) {
      alert("Invalid QR Code Data. Please scan a valid QR code.");
      inputField.focus();
      return;
    }

    const data = JSON.parse(scannedData);
    const { userNumber, floorNumber, vehicleType } = data;

    // Delete the parking session
    const response = await fetch(
      `https://app-4547xlrdnq-uc.a.run.app/api/delete/parkingSession/${userNumber}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error deleting session! Status: ${response.status}`);
    }

    alert(`Parking session for User ${userNumber} deleted successfully.`);
    console.log("Delete Successful");

    // Increment the available slots
    await incrementAvailableSlots(floorNumber, vehicleType);
  } catch (error) {
    console.error("Error Deleting Parking Session:", error);
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


function scan() {
  qrInput.style.display = "block";
  setTimeout(() => {
    // Use setTimeout
    inputField.focus();
  }, 0);
}

function isValidJSON(scannedData) {
  try {
    JSON.parse(scannedData);
    return true;
  } catch (e) {
    return false;
  }
}

async function updateHistory(scannedData) {
  if (!isValidJSON(scannedData)) {
    alert("Invalid QR Code Data. Please scan a valid QR code."); // Or other appropriate error handling
    // Stop further processing
    inputField.focus();
    return;
  }

  try {
    const data = JSON.parse(scannedData);

    const requestBody = {
      ticketNumber: data.ticketNumber,
      userNumber: data.userNumber,
      rate: data.rate,
      arrivalTime: data.arrivalTime,
      floorNumber: data.floorNumber,
      vehicleType: data.vehicleType,
    };
    const response = await fetch(
      "https://app-4547xlrdnq-uc.a.run.app/api/create/history",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const updateBody = {
      userNumber: data.userNumber,
      status: "Success",
      floorNumber: data.floorNumber,
      vehicleType: data.vehicleType,
    };
    const responseSession = await fetch(
      `https://app-4547xlrdnq-uc.a.run.app/api/update/parkingSession/${data.userNumber}`, // User's phone number assumed to be unique ID
      {
        method: "PUT", // Or PATCH if you're only updating part of the session
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody), // Data to update
      }
    );

    if (!responseSession.ok) {
      const errorData = await responseSession.json();
      const errorMessage =
        errorData.message || "Failed to update Parking Session";
      throw new Error(
        `HTTP error updating session! Status: ${responseSession.status}  - ${errorMessage}`
      );
    }

    alert(
      "SUCCESS: " + requestBody.ticketNumber + " " + requestBody.userNumber
    );
    const responseData = await response.json();
    console.log(responseData);
  } catch (error) {
    console.error("Error Processing QR Code:", error);
  }
}
