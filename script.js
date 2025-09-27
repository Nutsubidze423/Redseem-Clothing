// LOGIN FORM START
// Validation functions
function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9]{3,}@redberry\.ge$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 3;
}

function validateUsername(username) {
  return username.length >= 3;
}

function validateAvatar(file) {
  if (!file) return true;
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  return allowedTypes.includes(file.type);
}

const loginForm = document.querySelector("#loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.querySelector("#password").value;
  const email = document.querySelector("#email").value;

  if (!validateEmail(email)) {
    alert("Email must be at least 3 characters followed by @redberry.ge");
    return;
  }

  if (!validatePassword(password)) {
    alert("Password must be at least 3 characters long");
    return;
  }

  const userCredentials = {
    email: email,
    password: password,
  };

  loginUser(userCredentials);
});

async function loginUser(credentials) {
  try {
    const response = await axios.post(
      "https://api.redseam.redberryinternship.ge/api/login",
      credentials
    );
    console.log("Login success:", response.data);
  } catch (error) {
    const rightSide = document.querySelector(".right-side");
    if (rightSide) {
      const errorMsg = document.createElement("div");
      errorMsg.className = "login-error-message";
      errorMsg.textContent = "Email or password is incorrect.";
      errorMsg.style.color = "red";
      errorMsg.style.marginTop = "10px";
      errorMsg.style.fontFamily = "Poppins";
      rightSide.appendChild(errorMsg);
    }
    console.error("Login error:", error.response?.data || error.message);
  }
}

// LOGIN FORM END
