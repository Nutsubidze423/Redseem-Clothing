// Check for authentication token on page load
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  const userAvatar = localStorage.getItem("userAvatar");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const avatarElement = document.getElementById("userAvatar");
  if (userAvatar) {
    avatarElement.src = userAvatar;
  } else {
    avatarElement.src = "./Images/user.png";
  }
});
