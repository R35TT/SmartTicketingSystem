// Initialize Firebase
const auth = firebase.auth();

function logout() {
  if (confirm("Are you sure you want to log out?")) {
    firebase
      .auth()
      .signOut()
      .then(() => {
        console.log("User signed out");
        localStorage.clear(); // Clear all stored data
        window.location.href = "../index.html";
      })
      .catch((error) => {
        console.error("Error during logout:", error);
        alert("Failed to log out. Please try again.");
      });
  }
}
