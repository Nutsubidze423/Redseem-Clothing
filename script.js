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

const loginFormElement = document.querySelector("#loginForm");

loginFormElement.addEventListener("submit", async (e) => {
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
      const existingError = document.querySelector(".login-error-message");
      if (existingError) {
        existingError.remove();
      }

      const errorMsg = document.createElement("div");
      errorMsg.className = "login-error-message";
      errorMsg.textContent = "Email or password is incorrect.";
      errorMsg.style.color = "red";
      errorMsg.style.marginTop = "10px";
      errorMsg.style.fontFamily = "Poppins";
      rightSide.appendChild(errorMsg);

      setTimeout(() => {
        errorMsg.remove();
      }, 2000);
    }
    console.error("Login error:", error.response?.data || error.message);
  }
}

// Password visibility toggle functionality
const passwordToggles = document.querySelectorAll(".password-toggle");

passwordToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const targetId = toggle.dataset.target;
    const passwordInput = document.getElementById(targetId);

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggle.style.opacity = "1";
    } else {
      passwordInput.type = "password";
      toggle.style.opacity = "0.5";
    }
  });
});

// Form switching functionality
const showRegisterSpan = document.querySelector("#show-register");
const showLoginSpan = document.querySelector("#show-login");
const navLoginLinks = document.querySelectorAll(".login a");
const loginFormContainer = document.querySelector(
  ".right-side:not(.registration)"
);
const registrationFormContainer = document.querySelector(
  ".right-side.registration"
);

// Handle navbar login clicks
navLoginLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    registrationFormContainer.style.display = "none";
    loginFormContainer.style.display = "flex";
  });
});

showRegisterSpan.addEventListener("click", () => {
  loginFormContainer.style.display = "none";
  registrationFormContainer.style.display = "flex";
  avatarPreview.src = "./Images/fall of Icarus.jpeg";
  avatarPreview.style.display = "block";
});

showLoginSpan.addEventListener("click", () => {
  registrationFormContainer.style.display = "none";
  loginFormContainer.style.display = "flex";
});

// LOGIN FORM +SWITCHING BETWEEN REGISTER AND LOGIN END
// REGISTER FORM START
const registrationForm = document.querySelector("#registrationForm");
const uploadNewButton = document.querySelector(".upload-new");
const removeButton = document.querySelector(".remove");
const fileInput = document.querySelector("#file");
const avatarPreview = document.querySelector("#avatar-preview");

uploadNewButton.addEventListener("click", () => {
  fileInput.click();
});

// Handle file selection
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && validateAvatar(file)) {
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.src = e.target.result;
      avatarPreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

// Handle remove button click
removeButton.addEventListener("click", () => {
  fileInput.value = "";
  avatarPreview.src = "";
  avatarPreview.style.display = "none";
});


function showError(message) {
  removeErrorMessages();
  const errorMsg = document.createElement("div");
  errorMsg.className = "register-error-message";
  errorMsg.textContent = message;
  errorMsg.style.color = "red";
  errorMsg.style.marginTop = "10px";
  errorMsg.style.fontFamily = "Poppins";
  errorMsg.style.textAlign = "left";
  registrationForm.insertBefore(
    errorMsg,
    registrationForm.querySelector(".register-button")
  );
}

registrationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
 
  const email = document.querySelector("#email1").value;
  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password1").value;
  const passwordConfirmation = document.querySelector("#password2").value;
  const avatar = document.querySelector("#file").files[0];

  if (!validateEmail(email)) {
    showError("Email must be at least 3 characters followed by @redberry.ge");
    return;
  }

  if (!validateUsername(username)) {
    showError("Username must be at least 3 characters long");
    return;
  }

  if (!validatePassword(password)) {
    showError("Password must be at least 3 characters long");
    return;
  }

  if (password !== passwordConfirmation) {
    showError("Password confirmation does not match the password");
    return;
  }

  if (avatar && !validateAvatar(avatar)) {
    showError("Avatar must be an image file (jpg, png, gif, webp)");
    return;
  }

  const formData = new FormData();
  formData.append("email", email);
  formData.append("username", username);
  formData.append("password", password);
  formData.append("password_confirmation", passwordConfirmation);

  if (avatar) {
    formData.append("avatar", avatar);
  }

  userRegister(formData);
});

async function userRegister(formData) {
  try {
    const response = await axios.post(
      "https://api.redseam.redberryinternship.ge/api/register",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    console.log("Registration success:", response.data);
    registrationFormContainer.style.display = "none";
    loginFormContainer.style.display = "flex";
    showError("Registration successful! Please log in.");
  } catch (error) {
    console.error("Registration error:", error.response?.data || error.message);

    // Handle specific error cases
    if (error.response?.data) {
      const errors = error.response.data;
      if (errors.email) {
        showError("This email is already registered");
      } else if (errors.username) {
        showError("This username is already taken");
      } else {
        showError("Registration failed. Please try again.");
      }
    } else {
      showError("An error occurred. Please try again.");
    }
  }
}
