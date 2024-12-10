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

// Update the button state based on available slots
async function updateButtonState(floor, vehicleType) {
  const generateButton = document.getElementById("generateBtn");

  try {
    const docRef = db.collection("parkingSlots").doc(floor);
    const doc = await docRef.get();

    if (doc.exists) {
      const parkingData = doc.data();
      const availableSlots = parkingData[vehicleType];

      // Display available slots
      document.getElementById("availableSlot").textContent = availableSlots;

      // Disable or enable button based on available slots
      if (availableSlots === 0) {
        generateButton.disabled = true;
        generateButton.classList.add("no-spots");
        console.log("No spots available, button disabled");
      } else {
        generateButton.disabled = false;
        generateButton.classList.remove("no-spots");
        console.log("Spots available, button enabled");
      }
    } else {
      console.warn("No document found for this floor.");
      generateButton.disabled = true; // Disable the button if no data is found
    }
  } catch (error) {
    console.error("Error fetching slot data:", error);
    generateButton.disabled = true; // Disable the button in case of error
  }
}

// Generate a parking session and update available slots
async function generateParkingSession() {
  const floorLvl = document.getElementById("floorLvl").value;
  const vehicleType = document.getElementById("vehicleType").value;
  const mobileNumber = localStorage.getItem("userNumber");
  const url =
    "https://app-4547xlrdnq-uc.a.run.app/api/create/parkingSession";
  const generateButton = document.getElementById("generateBtn");

  const data = {
    vehicleType: vehicleType,
    floorNumber: floorLvl,
    phoneNumber: mobileNumber,
  }; 

  if (vehicleType === "PWD" || vehicleType === "Senior") {
    const confirmProceed = window.confirm(
      "You have selected 'PWD/Senior' parking. Please present a valid ID upon entering. Do you want to proceed?"
    );

    if (!confirmProceed) {
      console.log("User canceled PWD/Senior parking session generation.");
      return; // Exit the function if the user cancels
    }
  }
  // Fetch available slots to check if there are spots
  const docRef = db.collection("parkingSlots").doc(floorLvl);
  const doc = await docRef.get();

  if (doc.exists) {
    const parkingData = doc.data();
    const availableSlots = parkingData[vehicleType];

    // If no spots are available, disable the button and prevent session generation
    if (availableSlots === 0) {
      generateButton.disabled = true;
      console.log("No spots available, button disabled");
      return; // Exit the function to prevent session generation
    }
  } else {
    console.error("No document found for this floor.");
    generateButton.disabled = true;
    return;
  }

  // Disable button immediately to prevent multiple clicks
  generateButton.disabled = true;
  console.log("Button is now disabled to prevent multiple clicks");

  try {
    // Proceed with session generation if spots are available
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    console.log("Parking session created:", responseData);

    // Decrement the available slots in Firestore
    const docRef = db.collection("parkingSlots").doc(floorLvl);
    const doc = await docRef.get();
    if (doc.exists) {
      const parkingData = doc.data();
      let availableSlots = parkingData[vehicleType];

      console.log("Available Slots before decrement:", availableSlots);

      if (typeof availableSlots === "number" && availableSlots > 0) {
        // Decrement the slot count
        availableSlots--;
        await docRef.update({ [vehicleType]: availableSlots });
        document.getElementById("availableSlot").textContent = availableSlots;

        // Disable button if no slots are left
        if (availableSlots === 0) {
          generateButton.disabled = true;
          console.log("No spots left, button disabled");
        }

        console.log("Parking session created. Slots decremented.");
        console.log("Redirecting to parkingSession.html...");
        window.location.href = "../ParkingSession.html";
      } else {
        console.error("Invalid available slot count:", availableSlots);
      }
    }
  } catch (error) {
    console.error("Error generating parking session:", error);
  } finally {
    // Re-check available slots after session generation to update the button state
    console.log("Re-checking available slots to update button state.");
    await updateButtonState(floorLvl, vehicleType);
  }
} 

// Initialize button state on page load
async function updateButtonState(floor, vehicleType) {
  const generateButton = document.getElementById("generateBtn");

  try {
    // Fetch available slots
    const docRef = db.collection("parkingSlots").doc(floor);
    const doc = await docRef.get();

    if (doc.exists) {
      const parkingData = doc.data();
      const availableSlots = parkingData[vehicleType];

      // Display available slots
      document.getElementById("availableSlot").textContent = availableSlots;

      // Initially enable or disable button based on available slots
      if (availableSlots === 0) {
        generateButton.disabled = true;
        generateButton.classList.add("no-spots");
        console.log("No spots available, button disabled");
      } else {
        generateButton.disabled = false;
        generateButton.classList.remove("no-spots");
        console.log("Spots available, button enabled");
      }

      // Check user status and update button accordingly
      await checkUserStatus(generateButton);
    } else {
      console.warn("No document found for this floor.");
      generateButton.disabled = true; // Disable the button if no data is found
    }
  } catch (error) {
    console.error("Error fetching slot data:", error);
    generateButton.disabled = true; // Disable the button in case of error
  }
}

// Check the user's status from Firestore and update the button
async function checkUserStatus(button) {
  const mobileNumber = localStorage.getItem("userNumber"); // Replace with appropriate identifier

  try {
    // Fetch user document
    const userRef = db.collection("parkingSessions").doc(mobileNumber);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const userStatus = userData.status; // Assuming status field exists in the user document

      // Disable button if status is "Pending", "Success", or "Payment Successful"
      if (
        userStatus === "pending" ||
        userStatus === "Success" ||
        userStatus === "Payment Successful" 
      ) {
        button.disabled = true;
        console.log(`User status is "${userStatus}". Button disabled.`);
      } else {
        button.disabled = false; // Enable button for any other status or if null
        console.log(`User status is "${userStatus}". Button enabled.`);
      }
    } else {
      console.warn("No user document found. Assuming no status.");
      button.disabled = false; // Enable the button if no user document exists
    }
  } catch (error) {
    console.error("Error fetching user status:", error);
    button.disabled = true; // Disable button in case of an error
  }
}

// Initialize button state on page load
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

// Attach click event listener to the generate button
document.getElementById("generateBtn").addEventListener("click", async () => {
  const button = document.getElementById("generateBtn");

  // Check available slots and update button state
  const floorLvl = document.getElementById("floorLvl").value;
  const vehicleType = document.getElementById("vehicleType").value;
  const docRef = db.collection("parkingSlots").doc(floorLvl);
  const doc = await docRef.get();

  if (doc.exists) {
    const parkingData = doc.data();
    const availableSlots = parkingData[vehicleType];

    // If no spots are available, disable the button and prevent session generation
    if (availableSlots === 0) {
      button.disabled = true;
      console.log("No spots available, button disabled");
      return; // Exit the function to prevent session generation
    }
  } else {
    console.error("No document found for this floor.");
    button.disabled = true;
    return;
  }

  // Proceed with session generation if spots are available
  button.disabled = true; // Disable button immediately to prevent multiple clicks
  console.log("Button is now disabled to prevent multiple clicks");

  try {
    await generateParkingSession();
  } catch (error) {
    console.error("Error during session generation:", error);
  }
});
