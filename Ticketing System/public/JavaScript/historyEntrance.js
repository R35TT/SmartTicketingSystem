// Function to fetch and display history
renderHistory();
async function renderHistory() {
  let historyData = await fetchHistoryData();
  historyData = historyData.data;
  console.log("Original History Data:", historyData);
  const successHistory = historyData.filter(
    (item) => item.status === "Success"
  ); // Filter the array
  const applyFilterButton = document.getElementById("applyFilter");

  // Event listener for applying filters
  applyFilterButton.addEventListener("click", () => {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const sortOrder = document.getElementById("sortOrder").value;

    const filteredHistory = filterAndSortHistory(successHistory, startDate, endDate, sortOrder);
    displayHistory(filteredHistory);
  });

  // Initial display
  displayHistory(successHistory);
}

// Function to filter and sort history
function filterAndSortHistory(historyData, startDate, endDate, sortOrder) {
  let filteredData = historyData;

  if (startDate) {
    const startDateTime = new Date(startDate).getTime();
    filteredData = filteredData.filter(item => new Date(item.arrivalTime).getTime() >= startDateTime);
  }

  if (endDate) {
    const endDateTime = new Date(endDate).getTime();
    filteredData = filteredData.filter(item => new Date(item.arrivalTime).getTime() <= endDateTime);
  }

  filteredData.sort((a, b) => {
    const dateA = new Date(a.arrivalTime).getTime();
    const dateB = new Date(b.arrivalTime).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  return filteredData.filter(item => item.status === "Success");
}

// Function to display filtered and sorted history
function displayHistory(historyData) {
  console.log("Filtered and Sorted History Data:", historyData);

  const tableBody = document.getElementById("entranceTableBody");
  tableBody.innerHTML = ""; // Clear existing table data

  historyData.forEach(item => {
    const row = tableBody.insertRow();
    const ticketIdCell = row.insertCell();
    const timeInCell = row.insertCell();
    const entranceStatusCell = row.insertCell();
    const operationCell = row.insertCell(); // Add operation cell

    ticketIdCell.textContent = item.ticketNumber;

    const dateObj = new Date(item.arrivalTime);

    // Date Formatting
    const optionsDate = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDate = dateObj.toLocaleDateString(undefined, optionsDate);

    // Time Formatting (with AM/PM)
    const optionsTime = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    const formattedTime = dateObj.toLocaleTimeString(undefined, optionsTime);

    // Create separate elements for date and time
    const dateSpan = document.createElement("span");
    dateSpan.textContent = formattedDate;
    const timeSpan = document.createElement("span");
    timeSpan.textContent = formattedTime;

    timeInCell.appendChild(dateSpan);
    timeInCell.appendChild(document.createElement("br")); // Add a line break
    timeInCell.appendChild(timeSpan);
    entranceStatusCell.textContent = item.status;

    // Add operation button (example - you can customize this)
    const viewButton = document.createElement("button");
    viewButton.textContent = "View";
    viewButton.addEventListener("click", () => {
      // Handle view operation, e.g., show more details
      console.log("View clicked for Ticket ID:", item.ticketNumber);
      alert("Details for Ticket ID " + item.ticketNumber); // Example: showing an alert
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
    return data; // Return the parsed JSON data
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}
