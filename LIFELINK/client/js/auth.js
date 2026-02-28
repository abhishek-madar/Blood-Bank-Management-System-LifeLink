function showNotification(message, type) {
  const notification = document.getElementById("notification");
  if (notification) {
    notification.textContent = message;
    notification.className = "notification show notification-" + type;
    setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  } else {
    alert(message);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotLink =
    document.querySelector(".forgot-password") ||
    document.getElementById("forgotPassword");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  if (forgotLink) {
    forgotLink.addEventListener("click", function (e) {
      e.preventDefault();
      showNotification("Password reset feature coming soon!", "info");
    });
  }
});

async function handleLogin(e) {
  e.preventDefault();

  const email =
    document.getElementById("email")?.value ||
    document.getElementById("loginEmail")?.value;
  const password =
    document.getElementById("password")?.value ||
    document.getElementById("loginPassword")?.value;
  const btn = document.getElementById("loginBtn");

  if (!email || !password) {
    showNotification("Please fill all fields", "error");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification("Please enter a valid email", "error");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Logging in...";
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      showNotification("Login successful! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "/profile";
      }, 1500);
    } else {
      showNotification(data.message || "Invalid credentials", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Login";
      }
    }
  } catch (error) {
    showNotification("Server error. Please try again.", "error");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Login";
    }
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const fullName =
    document.getElementById("fullName")?.value ||
    document.getElementById("regFullName")?.value;
  const email =
    document.getElementById("email")?.value ||
    document.getElementById("regEmail")?.value;
  const phone =
    document.getElementById("phone")?.value ||
    document.getElementById("regPhone")?.value;
  const address =
    document.getElementById("address")?.value ||
    document.getElementById("regAddress")?.value;
  const bloodGroup =
    document.getElementById("bloodGroup")?.value ||
    document.getElementById("regBloodGroup")?.value;
  const password =
    document.getElementById("password")?.value ||
    document.getElementById("regPassword")?.value;
  const confirmPassword =
    document.getElementById("confirmPassword")?.value ||
    document.getElementById("regConfirmPassword")?.value;
  const btn = document.getElementById("registerBtn");

  if (
    !fullName ||
    !email ||
    !phone ||
    !address ||
    !bloodGroup ||
    !password ||
    !confirmPassword
  ) {
    showNotification("Please fill all fields", "error");
    return;
  }

  if (password !== confirmPassword) {
    showNotification("Passwords do not match", "error");
    return;
  }

  if (password.length < 6) {
    showNotification("Password must be at least 6 characters", "error");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification("Please enter a valid email", "error");
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    showNotification("Please enter a valid 10-digit phone number", "error");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Registering...";
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        address,
        bloodGroup,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      showNotification("Registration successful! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "/profile";
      }, 1500);
    } else {
      showNotification(data.message || "Registration failed", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Register";
      }
    }
  } catch (error) {
    showNotification("Server error. Please try again.", "error");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Register";
    }
  }
}

function handleGoogleLogin() {
  showNotification("Google login coming soon!", "info");
}

function handleFacebookLogin() {
  showNotification("Facebook login coming soon!", "info");
}
