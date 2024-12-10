// Function to fetch and display history
renderHistory();
async function renderHistory() {
  let historyData = await fetchHistoryData();
  historyData = historyData.data;
  console.log("Original History Data:", historyData);

  const applyFilterButton = document.getElementById("applyFilter");

  // Event listener for applying filters
  applyFilterButton.addEventListener("click", () => {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const sortOrder = document.getElementById("sortOrder").value;

    const filteredHistory = filterAndSortHistory(historyData, startDate, endDate, sortOrder);
    displayHistory(filteredHistory);
  });

  // Initial display
  displayHistory(historyData);
}

// Function to filter and sort history
function filterAndSortHistory(historyData, startDate, endDate, sortOrder) {
  let filteredData = historyData;

  if (startDate) {
    const startDateTime = new Date(startDate).getTime();
    filteredData = filteredData.filter(item => new Date(item.departureTime).getTime() >= startDateTime);
  }

  if (endDate) {
    const endDateTime = new Date(endDate).getTime();
    filteredData = filteredData.filter(item => new Date(item.departureTime).getTime() <= endDateTime);
  }

  filteredData.sort((a, b) => {
    const dateA = new Date(a.departureTime).getTime();
    const dateB = new Date(b.departureTime).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  return filteredData.filter(item => item.status === "Payment Successful");
}

// Function to display filtered and sorted history
function displayHistory(historyData) {
  console.log("Filtered and Sorted History Data:", historyData);

  const tableBody = document.getElementById("paymentTbl");
  tableBody.innerHTML = ""; // Clear existing table data

  historyData.forEach(item => {
    const row = tableBody.insertRow();
    const ticketIdCell = row.insertCell();
    const timeInCell = row.insertCell();
    const timeOutCell = row.insertCell();
    const feeCell = row.insertCell();
    const entranceStatusCell = row.insertCell();
    const operationCell = row.insertCell();

    ticketIdCell.textContent = item.ticketNumber;
    feeCell.textContent = item.fee;

    const dateObj1 = new Date(item.arrivalTime);
    const dateObj2 = new Date(item.departureTime);

    // Date Formatting
    const optionsDate = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDateIn = dateObj1.toLocaleDateString(undefined, optionsDate);
    const formattedDateOut = dateObj2.toLocaleDateString(undefined, optionsDate);

    // Time Formatting (with AM/PM)
    const optionsTime = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    const formattedTimeIn = dateObj1.toLocaleTimeString(undefined, optionsTime);
    const formattedTimeOut = dateObj2.toLocaleTimeString(undefined, optionsTime);

    // Populate time-in cell
    const dateSpanIn = document.createElement("span");
    dateSpanIn.textContent = formattedDateIn;
    const timeSpanIn = document.createElement("span");
    timeSpanIn.textContent = formattedTimeIn;

    timeInCell.appendChild(dateSpanIn);
    timeInCell.appendChild(document.createElement("br"));
    timeInCell.appendChild(timeSpanIn);

    // Populate time-out cell
    const dateSpanOut = document.createElement("span");
    dateSpanOut.textContent = formattedDateOut;
    const timeSpanOut = document.createElement("span");
    timeSpanOut.textContent = formattedTimeOut;

    timeOutCell.appendChild(dateSpanOut);
    timeOutCell.appendChild(document.createElement("br"));
    timeOutCell.appendChild(timeSpanOut);

    entranceStatusCell.textContent = item.status;

    // Add operation button
    const viewButton = document.createElement("button");
    viewButton.textContent = "View";
    viewButton.addEventListener("click", () => {
      console.log("View clicked for Ticket ID:", item.ticketNumber);
      alert("Details for Ticket ID " + item.ticketNumber);
    });
    operationCell.appendChild(viewButton);
  });
}

// Function to fetch history data
async function fetchHistoryData() {
  const apiUrl = "https://app-4547xlrdnq-uc.a.run.app/api/get/allHistory";

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
