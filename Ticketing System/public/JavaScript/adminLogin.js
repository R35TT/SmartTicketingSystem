function loginRequest() {
  const username = "admin";
  const password = "admin123";

  if (
    username == document.getElementById("username").value &&
    password == document.getElementById("password").value
  ) {
    window.location.href = "../adminHome.html";
  } else {
    alert("Incorrect username or password");
  }
}
