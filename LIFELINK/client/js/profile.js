document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  addNotificationBell();

  loadUserProfile();
  loadUserStats();
  loadDonationHistory();
  loadRequestHistory();
  calculateNextEligibility();

  const editProfileBtn = document.getElementById("editProfileBtn");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const downloadReportBtn = document.getElementById("downloadReport");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (editProfileBtn)
    editProfileBtn.addEventListener("click", toggleEditProfile);
  if (saveProfileBtn) saveProfileBtn.addEventListener("click", saveProfile);
  if (downloadReportBtn)
    downloadReportBtn.addEventListener("click", downloadCompleteReport);
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", toggleEditProfile);
});

function addNotificationBell() {
  const headerContainer = document.querySelector(".header-container");
  if (!headerContainer) return;

  if (document.querySelector(".notification-bell")) return;

  const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const bell = document.createElement("div");
  bell.className = "notification-bell";
  bell.innerHTML = `
        <i class="fas fa-bell bell-icon"></i>
        ${unreadCount > 0 ? `<span class="badge">${unreadCount}</span>` : ""}
    `;

  bell.addEventListener("click", function () {
    showNotifications();
  });

  const navCta = document.querySelector(".nav-cta");
  if (navCta) {
    headerContainer.insertBefore(bell, navCta);
  }
}

function showNotifications() {
  const notifications = JSON.parse(localStorage.getItem("notifications")) || [];

  const modal = document.createElement("div");
  modal.className = "notifications-modal";
  modal.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        width: 360px;
        max-height: 480px;
        overflow-y: auto;
        z-index: 1001;
        border: 1px solid var(--gray-200);
    `;

  let notificationsHtml =
    '<div style="padding: 20px;"><h3 style="margin-bottom: 16px; font-weight: 600;">Notifications</h3>';

  if (notifications.length === 0) {
    notificationsHtml +=
      '<p style="color: var(--gray-400); text-align: center; padding: 20px;">No notifications</p>';
  } else {
    notifications.forEach((notif, index) => {
      notificationsHtml += `
                <div class="notification-item" data-id="${index}" style="padding: 16px; border-bottom: 1px solid var(--gray-100); cursor: pointer; ${!notif.read ? "background: var(--red-light);" : ""}">
                    <div style="display: flex; gap: 12px;">
                        <i class="fas ${notif.icon}" style="color: var(--red-primary); font-size: 1.2rem;"></i>
                        <div>
                            <p style="font-weight: 500; margin-bottom: 4px;">${notif.title}</p>
                            <p style="color: var(--gray-400); font-size: 0.9rem;">${notif.message}</p>
                            <span style="color: var(--gray-400); font-size: 0.8rem;">${notif.time}</span>
                        </div>
                    </div>
                </div>
            `;
    });
  }

  notificationsHtml += "</div>";
  modal.innerHTML = notificationsHtml;

  document.body.appendChild(modal);

  const markAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    localStorage.setItem("notifications", JSON.stringify(updated));
    document.querySelector(".badge")?.remove();
  };

  modal.querySelectorAll(".notification-item").forEach((item) => {
    item.addEventListener("click", function () {
      markAsRead();
      modal.remove();
    });
  });

  setTimeout(() => {
    markAsRead();
    modal.remove();
  }, 5000);

  document.addEventListener("click", function closeModal(e) {
    if (!modal.contains(e.target) && !e.target.closest(".notification-bell")) {
      modal.remove();
      document.removeEventListener("click", closeModal);
    }
  });
}

async function loadUserProfile() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (response.ok) {
      displayProfile(data.user);
      displayDonations(data.recentDonations);
      displayRequests(data.recentRequests);
    } else {
      showNotification("Error loading profile", "error");
    }
  } catch (error) {
    showNotification("Server error", "error");
  }
}

function displayProfile(user) {
  const profileDiv = document.getElementById("profileInfo");
  if (!profileDiv) return;

  profileDiv.innerHTML = `
        <div class="info-grid">
            <p><i class="fas fa-user"></i> <strong>${user.fullName}</strong></p>
            <p><i class="fas fa-envelope"></i> ${user.email}</p>
            <p><i class="fas fa-phone"></i> ${user.phone || "Not provided"}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${user.address || "Not provided"}</p>
            <p><i class="fas fa-tint"></i> <strong>Blood Group:</strong> ${user.bloodGroup || "Not specified"}</p>
            <p><i class="fas fa-calendar"></i> Member since: ${formatDate(user.createdAt)}</p>
        </div>
    `;

  const editFullName = document.getElementById("editFullName");
  const editPhone = document.getElementById("editPhone");
  const editAddress = document.getElementById("editAddress");

  if (editFullName) editFullName.value = user.fullName || "";
  if (editPhone) editPhone.value = user.phone || "";
  if (editAddress) editAddress.value = user.address || "";
}

function displayDonations(donations) {
  const donationsDiv = document.getElementById("recentDonations");
  if (!donationsDiv) return;

  if (!donations || donations.length === 0) {
    donationsDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tint"></i>
                <h3>No donations yet</h3>
                <p>You haven't made any blood donations yet. Your first donation could save up to three lives.</p>
                <a href="/donate" class="btn btn-primary btn-small">
                    <i class="fas fa-plus"></i> Schedule your first donation
                </a>
            </div>
        `;
    return;
  }

  donationsDiv.innerHTML = donations
    .map(
      (donation) => `
        <div class="history-item">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div>
                    <span class="status-badge ${donation.eligibilityStatus === "eligible" ? "completed" : "pending"}">
                        <i class="fas ${donation.eligibilityStatus === "eligible" ? "fa-check-circle" : "fa-clock"}"></i>
                        ${donation.eligibilityStatus === "eligible" ? "Completed" : "Pending"}
                    </span>
                </div>
                <span style="color: var(--gray-400); font-size: 0.9rem;">${formatDate(donation.createdAt)}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                <div>
                    <span style="color: var(--gray-400); font-size: 0.8rem;">Blood Group</span>
                    <p style="font-weight: 600; color: var(--red-primary);">${donation.bloodGroup}</p>
                </div>
                <div>
                    <span style="color: var(--gray-400); font-size: 0.8rem;">Donation Date</span>
                    <p style="font-weight: 500;">${formatDate(donation.donationDate)}</p>
                </div>
                <div style="grid-column: span 2;">
                    <span style="color: var(--gray-400); font-size: 0.8rem;">Center</span>
                    <p style="font-weight: 500;">${donation.donationCenter}</p>
                </div>
            </div>
            <button onclick="downloadDonationPDF('${donation._id}')" class="btn btn-secondary btn-small" style="margin-top: 12px; width: 100%;">
                <i class="fas fa-download"></i> Download Certificate
            </button>
        </div>
    `,
    )
    .join("");
}

function displayRequests(requests) {
  const requestsDiv = document.getElementById("recentRequests");
  if (!requestsDiv) return;

  if (!requests || requests.length === 0) {
    requestsDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-hand-holding-heart"></i>
                <h3>No requests yet</h3>
                <p>You haven't made any blood requests. Need blood? Create your first request now.</p>
                <a href="/request" class="btn btn-primary btn-small">
                    <i class="fas fa-plus"></i> Create blood request
                </a>
            </div>
        `;
    return;
  }

  requestsDiv.innerHTML = requests
    .map(
      (request) => `
        <div class="history-item">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div>
                    <span class="status-badge ${request.status}">
                        <i class="fas ${request.status === "completed" ? "fa-check-circle" : request.status === "pending" ? "fa-clock" : "fa-times-circle"}"></i>
                        ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                </div>
                <span style="color: var(--gray-400); font-size: 0.9rem;">${formatDate(request.createdAt)}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                <div>
                    <span style="color: var(--gray-400); font-size: 0.8rem;">Patient</span>
                    <p style="font-weight: 600;">${request.patientName}</p>
                </div>
                <div>
                    <span style="color: var(--gray-400); font-size: 0.8rem;">Blood Group</span>
                    <p style="font-weight: 600; color: var(--red-primary);">${request.bloodGroup}</p>
                </div>
                <div>
                    <span style="color: var(--gray-400); font-size: 0.8rem;">Units</span>
                    <p style="font-weight: 500;">${request.unitsRequired}</p>
                </div>
                <div>
                    <span style="color: var(--gray-400); font-size: 0.8rem;">Urgency</span>
                    <p style="font-weight: 500; color: ${request.urgencyLevel === "emergency" ? "#dc2626" : request.urgencyLevel === "urgent" ? "#f59e0b" : "#10b981"};">${request.urgencyLevel}</p>
                </div>
                <div style="grid-column: span 2;">
                    <span style="color: var(--gray-400); font-size: 0.8rem;">Hospital</span>
                    <p style="font-weight: 500;">${request.hospitalName}</p>
                </div>
            </div>
            <button onclick="downloadRequestPDF('${request._id}')" class="btn btn-secondary btn-small" style="margin-top: 12px; width: 100%;">
                <i class="fas fa-download"></i> Download Details
            </button>
        </div>
    `,
    )
    .join("");
}

async function loadUserStats() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/users/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const stats = await response.json();
    const statsDiv = document.getElementById("userStats");

    if (statsDiv) {
      statsDiv.innerHTML = `
                <div class="stat-card">
                    <i class="fas fa-tint"></i>
                    <h3>${stats.totalDonations || 0}</h3>
                    <p>Total Donations</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-hand-holding-heart"></i>
                    <h3>${stats.totalRequests || 0}</h3>
                    <p>Total Requests</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-check-circle"></i>
                    <h3>${stats.completedRequests || 0}</h3>
                    <p>Completed</p>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

async function loadDonationHistory() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/donations/my-donations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const donations = await response.json();

    if (donations && donations.length > 0) {
      localStorage.setItem("lastDonation", JSON.stringify(donations[0]));
    }
  } catch (error) {
    console.error("Error loading donation history:", error);
  }
}

async function loadRequestHistory() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/requests/my-requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error("Error loading request history:", error);
  }
}

function calculateNextEligibility() {
  const lastDonation = JSON.parse(localStorage.getItem("lastDonation"));
  const eligibilityCard = document.getElementById("eligibilityCard");

  if (!eligibilityCard) return;

  if (!lastDonation) {
    eligibilityCard.innerHTML = `
            <div class="eligibility-card">
                <h4><i class="fas fa-calendar-check"></i> Donation Eligibility</h4>
                <div class="date">You're eligible now!</div>
                <p class="note">First-time donors can donate immediately. Schedule your first donation today.</p>
                <a href="/donate" class="btn btn-primary btn-small" style="margin-top: 12px;">
                    <i class="fas fa-calendar-plus"></i> Schedule Donation
                </a>
            </div>
        `;
    return;
  }

  const lastDonationDate = new Date(lastDonation.donationDate);
  const nextEligibleDate = new Date(lastDonationDate);
  nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3);

  const today = new Date();
  const daysUntilEligible = Math.ceil(
    (nextEligibleDate - today) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilEligible <= 0) {
    eligibilityCard.innerHTML = `
            <div class="eligibility-card">
                <h4><i class="fas fa-calendar-check"></i> Donation Eligibility</h4>
                <div class="date">You're eligible now!</div>
                <p class="note">Your waiting period is over. You can donate blood again.</p>
                <a href="/donate" class="btn btn-primary btn-small" style="margin-top: 12px;">
                    <i class="fas fa-calendar-plus"></i> Schedule Donation
                </a>
            </div>
        `;
  } else {
    eligibilityCard.innerHTML = `
            <div class="eligibility-card">
                <h4><i class="fas fa-calendar-alt"></i> Next Eligible Donation</h4>
                <div class="date">${nextEligibleDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                <p class="note">You can donate again in ${daysUntilEligible} days. Thank you for being a donor!</p>
                <div style="margin-top: 12px; background: rgba(255,71,87,0.1); border-radius: 100px; height: 6px;">
                    <div style="width: ${Math.min(100, ((90 - daysUntilEligible) / 90) * 100)}%; background: var(--red-primary); height: 6px; border-radius: 100px;"></div>
                </div>
            </div>
        `;
  }
}

function toggleEditProfile() {
  const viewDiv = document.getElementById("profileView");
  const editDiv = document.getElementById("profileEdit");

  if (viewDiv && editDiv) {
    if (viewDiv.style.display === "none") {
      viewDiv.style.display = "block";
      editDiv.style.display = "none";
    } else {
      viewDiv.style.display = "none";
      editDiv.style.display = "block";
    }
  }
}

async function saveProfile() {
  const fullName = document.getElementById("editFullName")?.value;
  const phone = document.getElementById("editPhone")?.value;
  const address = document.getElementById("editAddress")?.value;
  const saveBtn = document.getElementById("saveProfileBtn");

  if (!fullName) {
    showNotification("Full name is required", "error");
    return;
  }

  if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
    showNotification("Please enter a valid 10-digit phone number", "error");
    return;
  }

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Saving...';
    }

    const token = localStorage.getItem("token");
    const response = await fetch("/api/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName,
        phone: phone ? phone.replace(/\D/g, "") : "",
        address,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showNotification("Profile updated successfully", "success");

      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.fullName = fullName;
        localStorage.setItem("user", JSON.stringify(user));
      }

      document.getElementById("profileView").style.display = "block";
      document.getElementById("profileEdit").style.display = "none";

      loadUserProfile();
    } else {
      showNotification(data.message || "Error updating profile", "error");
    }
  } catch (error) {
    showNotification("Server error", "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = "Save Changes";
    }
  }
}

async function downloadDonationPDF(id) {
  try {
    showNotification("Generating PDF...", "info");

    const token = localStorage.getItem("token");
    const response = await fetch(`/api/donations/pdf/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donation-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification("PDF downloaded successfully", "success");
  } catch (error) {
    showNotification("Error downloading PDF", "error");
  }
}

async function downloadRequestPDF(id) {
  try {
    showNotification("Generating PDF...", "info");

    const token = localStorage.getItem("token");
    const response = await fetch(`/api/requests/pdf/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `request-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification("PDF downloaded successfully", "success");
  } catch (error) {
    showNotification("Error downloading PDF", "error");
  }
}

async function downloadCompleteReport() {
  showNotification("Generating complete report...", "info");

  try {
    const token = localStorage.getItem("token");

    const [donationsRes, requestsRes] = await Promise.all([
      fetch("/api/donations/my-donations", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/api/requests/my-requests", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const donations = await donationsRes.json();
    const requests = await requestsRes.json();
    const user = JSON.parse(localStorage.getItem("user"));

    if (typeof window.jspdf === "undefined") {
      showNotification("PDF library not loaded", "error");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(24);
    doc.setTextColor(255, 71, 87);
    doc.text("VitalSync", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Complete Activity Report", 105, 35, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated for: ${user?.fullName || "User"}`, 20, 50);
    doc.text(`Email: ${user?.email || "N/A"}`, 20, 58);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 66);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 75, 190, 75);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Donation History", 20, 90);

    let yPos = 100;
    if (!donations || donations.length === 0) {
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text("No donations recorded", 30, yPos);
      yPos += 10;
    } else {
      donations.slice(0, 5).forEach((d, index) => {
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `${index + 1}. ${d.bloodGroup} - ${d.donationCenter}`,
          30,
          yPos,
        );
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(formatDate(d.donationDate), 160, yPos);
        yPos += 8;
      });
    }

    yPos += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, yPos - 5, 190, yPos - 5);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Blood Requests", 20, yPos + 5);

    yPos += 15;
    if (!requests || requests.length === 0) {
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text("No requests recorded", 30, yPos);
    } else {
      requests.slice(0, 5).forEach((r, index) => {
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `${index + 1}. ${r.patientName} - ${r.bloodGroup} (${r.unitsRequired} units)`,
          30,
          yPos,
        );
        doc.setFontSize(10);
        doc.setTextColor(
          r.status === "completed"
            ? "#10b981"
            : r.status === "pending"
              ? "#f59e0b"
              : "#6b7280",
        );
        doc.text(r.status, 160, yPos);
        yPos += 8;
      });
    }

    yPos += 20;
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for being a life-saver!", 105, 270, {
      align: "center",
    });
    doc.text(`Report ID: ${Date.now()}`, 105, 280, { align: "center" });

    doc.save("vitalsync-complete-report.pdf");
    showNotification("Report generated successfully!", "success");
  } catch (error) {
    showNotification("Error generating report", "error");
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function showNotification(message, type) {
  const notification = document.getElementById("notification");
  if (notification) {
    notification.textContent = message;
    notification.className = `notification show notification-${type}`;
    setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  } else {
    const notif = document.createElement("div");
    notif.className = `notification notification-${type}`;
    notif.textContent = message;
    notif.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            padding: 16px 28px;
            border-radius: 100px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        `;
    document.body.appendChild(notif);
    setTimeout(() => {
      if (notif.parentElement) notif.remove();
    }, 3000);
  }
}

window.downloadDonationPDF = downloadDonationPDF;
window.downloadRequestPDF = downloadRequestPDF;
window.toggleEditProfile = toggleEditProfile;
window.logout = function () {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("lastDonation");
  window.location.href = "/";
};
