const inputField = document.getElementById("barcodeInputVerify");
const qrInput = document.getElementById("qrScanVerify");
let currentScannedData = {};
let userNumber;
let ticketId;

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
    currentScannedData = scannedData;
    renderHistory(scannedData);
  }
  inputField.value = ""; // Clear input field
}

function scanVerify() {
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

function getHistoryDta(scannedData) {
  try {
    const data = JSON.parse(scannedData);
    userNumber = data.userNumber;
    ticketId = data.ticketNumber;
  } catch (error) {
    console.error("Error parsing QR code data:", error);
    alert("Invalid QR code data.");
  }
}

// Function to fetch and display history
async function renderHistory(scannedData) {
  if (!isValidJSON(scannedData)) {
    alert("Invalid QR Code Data. Please scan a valid QR code.");
    inputField.focus();
    return;
  }

  getHistoryDta(scannedData);
  console.log("User Number:", userNumber);
  console.log("Ticket ID:", ticketId);

  let historyData = await fetchHistoryData(userNumber, ticketId);

  if (!historyData || !historyData.data) {
    console.error("No data returned from API:", historyData);
    // Handle the case where data is null or undefined (e.g., show an error message)
    return;
  }

  let displayHistory = historyData.data; // Use the data directly

  if (!Array.isArray(displayHistory)) {
    displayHistory = [displayHistory]; // Wrap in an array if it's a single object
  }
  const tableBody = document.getElementById("verifyTable");
  tableBody.innerHTML = "";

  displayHistory.forEach((item) => {
    const row = tableBody.insertRow();
    const ticketIdCell = row.insertCell();
    const timeInCell = row.insertCell();
    const timeOutCell = row.insertCell();
    const entranceStatusCell = row.insertCell();
    const operationCell = row.insertCell(); // Add operation cell

    ticketIdCell.textContent = item.ticketNumber;
    const dateObj1 = new Date(item.arrivalTime);
    const dateObj2 = new Date(item.departureTime);
    // Date Formatting
    const optionsDate = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDateIn = dateObj1.toLocaleDateString(undefined, optionsDate);
    const formattedDateOut = dateObj2.toLocaleDateString(
      undefined,
      optionsDate
    );

    // Time Formatting (with AM/PM)
    const optionsTime = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    const formattedTimeIn = dateObj1.toLocaleTimeString(undefined, optionsTime);
    const formattedTimeOut = dateObj2.toLocaleTimeString(
      undefined,
      optionsTime
    );

    // Create separate elements for date and time in
    const dateSpanIn = document.createElement("span");
    dateSpanIn.textContent = formattedDateIn;
    const timeSpanIn = document.createElement("span");
    timeSpanIn.textContent = formattedTimeIn;

    timeInCell.appendChild(dateSpanIn);
    timeInCell.appendChild(document.createElement("br")); // Add a line break
    timeInCell.appendChild(timeSpanIn);
    entranceStatusCell.textContent = item.status;

    // Create separate elements for date and time out
    const dateSpanOut = document.createElement("span");
    dateSpanOut.textContent = formattedDateOut;
    const timeSpanOut = document.createElement("span");

    timeOutCell.appendChild(dateSpanOut);
    timeOutCell.appendChild(document.createElement("br")); // Add a line break
    timeOutCell.appendChild(timeSpanOut);

    timeSpanOut.textContent = formattedTimeOut;

    // Add operation button (example - you can customize this)
    const viewButton = document.createElement("button");
    viewButton.textContent = "View";
    viewButton.addEventListener("click", () => {
      // Handle view operation, e.g., show more details
      console.log("View clicked for Ticket ID:", item.ticketNumber); //or other relevant data.
      alert("Details for Ticket ID " + item.ticketNumber); // Example: showing an alert
    });
    operationCell.appendChild(viewButton);
  });
}

async function fetchHistoryData(userNumber, ticketId) {
  const apiUrl = `https://app-4547xlrdnq-uc.a.run.app/api/get/history/${userNumber}/${ticketId}`;
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("History Data:", data);
    return data; // Return the parsed JSON data
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

verifyBtn.addEventListener("click", () => {
  if (!currentScannedData) {
    alert("No data to verify. Please scan a QR code first.");
    return;
  }
  console.log(currentScannedData); 
  updateHistory(currentScannedData);
});

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
    };
    const response = await fetch(
      "https://app-4547xlrdnq-uc.a.run.app/api/update/history/status/"+data.userNumber+"/"+data.ticketNumber,
      {
        method: "PUT",
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
    };
    const responseSession = await fetch(
      `https://app-4547xlrdnq-uc.a.run.app/api/update/parkingSession/status/${data.userNumber}`, // User's phone number assumed to be unique ID
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

