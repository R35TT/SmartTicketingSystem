const inputField = document.getElementById("barcodeInputPayment");
const qrInput = document.getElementById("qrScanPayment");
let userNumber;
let ticketId;
let rate;

inputField.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    processInput(); // Process the input when Enter is pressed
  }
});

function processInput() {
  const scannedData = inputField.value.trim();
  if (scannedData === "") {
    console.log("Empty input field");
    alert("Please enter data."); // Alert for empty input
  } else {
    console.log("Processed Input:", scannedData);
    qrInput.value = "";
    qrInput.style.display = "none";
    updateHistory(scannedData);
  }
  inputField.value = ""; // Clear the input field *after* processing
}

function getHistoryDta(scannedData) {
  try {
    const data = JSON.parse(scannedData);
    userNumber = data.userNumber;
    ticketId = data.ticketNumber;
    arrivalTime = new Date(data.arrivalTime); // Convert arrivalTime to Date object
  } catch (error) {
    console.error("Error parsing QR code data:", error);
    alert("Invalid QR code data.");
  }
}

function calculateFee(arrivalTime) {
  // Accept arrivalTime as a Date object
  const currentTime = new Date();
  const elapsedTime = new Date(currentTime - arrivalTime);
  const hoursParked = Math.ceil(elapsedTime / (1000 * 60 * 60));

  // Fee Structure
  const baseHours = 4;
  const baseRate = 50;
  const additionalHourlyRate = 30;

  // Calculate total fee
  let totalFee = baseRate; // Start with the base rate

  if (hoursParked > baseHours) {
    const additionalHours = hoursParked - baseHours;
    totalFee += additionalHours * additionalHourlyRate;
  }

  return totalFee;
}
async function updateHistory(scannedData) {
  let updateData = {}; // Declare updateData outside the if block
  let updateBody = {};
  if (!isValidJSON(scannedData)) {
    alert("Invalid QR Code Data. Please scan a valid QR code.");
    inputField.focus();
    return;
  }

  getHistoryDta(scannedData);

  if (arrivalTime) {
    const fee = calculateFee(arrivalTime);
    console.log("Calculated Fee:", fee);

    updateData.fee = fee;
    updateBody.fee = fee;
    (updateBody.userNumber = userNumber),
    (updateBody.status = "Payment Successful"); // Assign the fee to updateData
  } else {
    console.error("Arrival time not available. Cannot calculate fee.");
    alert("Invalid QR Code Data. Arrival time missing."); // Inform the user
    return; // Stop further execution
  }

  try {
    const response = await fetch(
      "https://app-4547xlrdnq-uc.a.run.app/api/update/history/" +
        userNumber +
        "/" +
        ticketId,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseSession = await fetch(
      `https://app-4547xlrdnq-uc.a.run.app/api/update/parkingSession/payment/` +
        userNumber, // User's phone number assumed to be unique ID
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody), // Data to update
      }
    );
    alert("SUCCESS: " + ticketId + " " + userNumber);
    const responseData = await response.json();
    console.log(responseData);
  } catch (error) {
    console.error("Error Processing QR Code:", error);
  }
}

function scanPayment() {
  qrInput.style.display = "block";
  inputField.focus();
}

function isValidJSON(scannedData) {
  try {
    JSON.parse(scannedData);
    return true;
  } catch (e) {
    return false;
  }
}
