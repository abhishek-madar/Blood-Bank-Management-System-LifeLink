let previousEmergencyCount = 0;
let emergencyPollingInterval = null;

document.addEventListener("DOMContentLoaded", function () {
  loadActiveEmergencies();
  updateAuthUI();
  startEmergencyPolling();
});

async function loadActiveEmergencies() {
  try {
    const response = await fetch("/api/emergency/active");
    const emergencies = await response.json();
    const alertContainer = document.getElementById("emergencyAlerts");
    const emergencyList = document.getElementById("emergencyList");

    if (
      alertContainer &&
      emergencyList &&
      emergencies &&
      emergencies.length > 0
    ) {
      alertContainer.style.display = "block";
      emergencyList.innerHTML = emergencies
        .map(
          (emergency) => `
                <div class="alert-item">
                    <div class="alert-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="alert-content">
                        <h4>${emergency.title}</h4>
                        <p>${emergency.message}</p>
                        <p><strong>Blood group:</strong> ${emergency.bloodGroup} | <strong>Location:</strong> ${emergency.location}</p>
                    </div>
                </div>
            `,
        )
        .join("");
    }

    if (
      emergencies &&
      emergencies.length > previousEmergencyCount &&
      previousEmergencyCount > 0
    ) {
      showNotification("New emergency alert", "info");
    }
    previousEmergencyCount = emergencies?.length || 0;
  } catch (error) {
    console.error("Error loading emergencies:", error);
  }
}

function startEmergencyPolling() {
  emergencyPollingInterval = setInterval(loadActiveEmergencies, 30000);
}

function updateAuthUI() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const headerContainer = document.querySelector(".header-container");

  if (!headerContainer) return;

  const existingAuthLinks = document.getElementById("authLinks");
  const existingNavCta = document.getElementById("navCta");

  if (existingAuthLinks) {
    existingAuthLinks.remove();
  }

  if (existingNavCta) {
    existingNavCta.remove();
  }

  if (token && user) {
    const authElement = document.createElement("div");
    authElement.id = "authLinks";
    authElement.className = "profile-container";
    authElement.innerHTML = `
            <div class="profile-dropdown">
                <div class="profile-icon">
                    <i class="fas fa-user"></i>
                </div>
                <div class="dropdown-menu">
                    <a href="/profile"><i class="fas fa-user"></i> Profile</a>
                    <a href="/donate"><i class="fas fa-tint"></i> My donations</a>
                    <a href="/request"><i class="fas fa-hand-holding-heart"></i> My requests</a>
                    <div class="dropdown-divider"></div>
                    <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Log out</a>
                </div>
            </div>
        `;
    headerContainer.appendChild(authElement);
  } else {
    const navCta = document.createElement("div");
    navCta.id = "navCta";
    navCta.className = "nav-cta";
    navCta.innerHTML = `
            <a href="/login" class="btn-login">Log in</a>
            <a href="/register" class="btn-register">Sign up</a>
        `;
    headerContainer.appendChild(navCta);
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        padding: 12px 24px;
        border-radius: 100px;
        color: white;
        font-weight: 500;
        font-size: 0.95rem;
        z-index: 9999;
        animation: slideIn 0.2s ease;
        background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    `;
  document.body.appendChild(notification);
  setTimeout(() => {
    if (notification.parentElement) notification.remove();
  }, 3000);
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .header-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        position: relative;
    }
    
    .nav-links {
        display: flex;
        gap: 2px;
        list-style: none;
        margin: 0;
        padding: 4px;
        background: #f8f9fa;
        border-radius: 100px;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
    }
    
    .nav-links a {
        display: inline-block;
        padding: 8px 20px;
        text-decoration: none;
        color: #495057;
        font-weight: 500;
        font-size: 0.95rem;
        border-radius: 100px;
        transition: all 0.2s ease;
        white-space: nowrap;
    }
    
    .nav-links a:hover {
        color: #ff4757;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
    
    .nav-links a.active {
        background: white;
        color: #ff4757;
        box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        font-weight: 600;
    }
    
    .nav-cta {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-left: auto;
    }
    
    .btn-login {
        padding: 8px 20px;
        background: transparent;
        border: 1px solid #e9ecef;
        color: #495057;
        border-radius: 100px;
        font-weight: 500;
        font-size: 0.95rem;
        text-decoration: none;
        transition: all 0.2s ease;
        white-space: nowrap;
    }
    
    .btn-login:hover {
        background: #f8f9fa;
        border-color: #dee2e6;
        transform: translateY(-1px);
    }
    
    .btn-register {
        padding: 8px 20px;
        background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
        border: none;
        color: white;
        border-radius: 100px;
        font-weight: 500;
        font-size: 0.95rem;
        text-decoration: none;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(255, 71, 87, 0.2);
        white-space: nowrap;
    }
    
    .btn-register:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(255, 71, 87, 0.3);
    }
    
    .profile-container {
        margin-left: auto;
    }
    
    .profile-dropdown {
        position: relative;
        display: inline-block;
    }
    
    .profile-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
        box-shadow: 0 4px 12px rgba(255, 71, 87, 0.2);
    }
    
    .profile-icon:hover {
        transform: scale(1.05);
        border-color: white;
        box-shadow: 0 6px 16px rgba(255, 71, 87, 0.3);
    }
    
    .profile-icon i {
        color: white;
        font-size: 1.2rem;
    }
    
    .dropdown-menu {
        position: absolute;
        top: 52px;
        right: 0;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        min-width: 200px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-8px);
        transition: all 0.2s ease;
        z-index: 1001;
        border: 1px solid #f1f3f5;
        overflow: hidden;
    }
    
    .profile-dropdown:hover .dropdown-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }
    
    .dropdown-menu a {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        color: #212529;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.95rem;
        transition: all 0.15s ease;
        border-bottom: 1px solid #f8f9fa;
    }
    
    .dropdown-menu a:last-child {
        border-bottom: none;
    }
    
    .dropdown-menu a:hover {
        background: #fff5f5;
        color: #ff4757;
    }
    
    .dropdown-menu a i {
        width: 18px;
        color: #ff4757;
        font-size: 1rem;
    }
    
    .dropdown-menu a:last-child i {
        color: #868e96;
    }
    
    .dropdown-menu a:last-child:hover i {
        color: #ff4757;
    }
    
    .dropdown-divider {
        height: 1px;
        background: #f1f3f5;
        margin: 4px 0;
    }
    
    @media (max-width: 768px) {
        .nav-links {
            display: none;
        }
        
        .nav-cta {
            display: none;
        }
        
        .profile-container {
            margin-left: auto;
        }
    }
`;
document.head.appendChild(style);
