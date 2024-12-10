// Firebase Config
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
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  // Add/Update Parking Spot
  document.getElementById("parkingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const floorNumber = document.getElementById("floorNumber").value.trim();
    const vehicleType = document.getElementById("vehicleType").value;
    const slotCount = parseInt(document.getElementById("slotCount").value, 10);
  
    try {
      const docRef = db.collection("parkingSlots").doc(floorNumber);
      await docRef.set(
        { [vehicleType]: slotCount }, 
        { merge: true } // Merge to avoid overwriting other fields
      );
      alert(`Successfully added/updated ${vehicleType} slots for ${floorNumber}`);
      fetchParkingSlots(); // Refresh table
    } catch (error) {
      console.error("Error adding/updating parking slots:", error);
    }
  });
  
  // Delete Parking Spot
  document.getElementById("deleteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const floorNumber = document.getElementById("deleteFloor").value.trim();
  
    try {
      await db.collection("parkingSlots").doc(floorNumber).delete();
      alert(`Floor ${floorNumber} deleted successfully.`);
      fetchParkingSlots(); // Refresh table
    } catch (error) {
      console.error("Error deleting floor:", error);
    }
  });
  
  // Fetch and Display Parking Slots
  async function fetchParkingSlots() {
    const tableBody = document.querySelector("#parkingTable tbody");
    tableBody.innerHTML = ""; // Clear existing rows
  
    try {
      const snapshot = await db.collection("parkingSlots").get();
  
      if (snapshot.empty) {
        const row = tableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 5;
        cell.textContent = "No parking slots available.";
        return;
      }
  
      snapshot.forEach((doc) => {
        const row = tableBody.insertRow();
        const floorCell = row.insertCell(0);
        const carCell = row.insertCell(1);
        const motorCell = row.insertCell(2);
        const pwdCell = row.insertCell(3);
        const seniorCell = row.insertCell(4);
  
        const data = doc.data();
  
        floorCell.textContent = doc.id;
        carCell.textContent = data.Car || 0; 
        motorCell.textContent = data.Motorcycle || 0;
        pwdCell.textContent = data.PWD || 0;
        seniorCell.textContent = data.Senior || 0;
      });
    } catch (error) {
      console.error("Error fetching parking slots:", error);
    }
  }
  
  // Initialize the table on load
  fetchParkingSlots();
  