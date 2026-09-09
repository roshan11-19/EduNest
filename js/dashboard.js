/**
 * EduNest - Teacher Admin Dashboard Script
 * Manages live registrations loading, statistics, multi-criteria filtering,
 * instant status transitions, CSV data export, and Profile/Password Management.
 */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // Check auth first
  if (!EduNest.AuthService.isAuthenticated()) return;

  // State
  let allRegistrations = [];
  let currentFilterStatus = "all";

  // DOM Elements
  const tableBody = document.getElementById("registrationsTableBody");
  const tableLoading = document.getElementById("tableLoadingSpinner");
  const tableCountDisplay = document.getElementById("tableCountDisplay");
  const searchInput = document.getElementById("searchInput");
  const filterClass = document.getElementById("filterClass");
  const filterBoard = document.getElementById("filterBoard");
  const filterSubject = document.getElementById("filterSubject");
  const filterStatus = document.getElementById("filterStatus");
  const btnReset = document.getElementById("btnResetFilters");
  const btnRefresh = document.getElementById("btnRefreshData");
  const btnExport = document.getElementById("btnExportCsv");

  // Stat counters
  const metricTotal = document.getElementById("metricTotal");
  const metricNew = document.getElementById("metricNew");
  const metricContacted = document.getElementById("metricContacted");
  const metricConfirmed = document.getElementById("metricConfirmed");

  // Sidebar badge elements
  const badgeAll = document.getElementById("badgeAllCount");
  const badgeNew = document.getElementById("badgeNewCount");
  const badgeContacted = document.getElementById("badgeContactedCount");
  const badgeConfirmed = document.getElementById("badgeConfirmedCount");
  const badgeCompleted = document.getElementById("badgeCompletedCount");

  // Profile Modal Elements
  const profileModal = document.getElementById("profileSettingsModal");
  const btnOpenProfile = document.getElementById("btnOpenProfileModal");
  const btnSidebarSettings = document.getElementById("btnSidebarSettings");
  const btnCloseProfile = document.getElementById("btnCloseProfileModal");
  const modalProfileName = document.getElementById("modalProfileName");
  const modalProfilePhone = document.getElementById("modalProfilePhone");
  const modalProfileEmail = document.getElementById("modalProfileEmail");
  const btnSendPasswordResetModal = document.getElementById("btnSendPasswordResetModal");
  const modalChangePasswordForm = document.getElementById("modalChangePasswordForm");
  const modalChangeEmailForm = document.getElementById("modalChangeEmailForm");

  // ==========================================
  // 1. TIME-AWARE GREETING
  // ==========================================
  const greetingTitle = document.getElementById("greetingTitle");
  if (greetingTitle) {
    const hour = new Date().getHours();
    let timeGreeting = "Good Morning";
    if (hour >= 12 && hour < 17) timeGreeting = "Good Afternoon";
    else if (hour >= 17) timeGreeting = "Good Evening";
    greetingTitle.textContent = `${timeGreeting}, Teacher`;
  }

  // Toast notification helper
  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    const icon = type === "error" ? "fa-circle-exclamation" : "fa-circle-check";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3500);
  }

  // ==========================================
  // 2. FETCH REGISTRATIONS
  // ==========================================
  async function loadRegistrations() {
    if (tableLoading) tableLoading.style.display = "block";
    try {
      const res = await EduNest.RegistrationService.getAllRegistrations();
      if (res.success && Array.isArray(res.data)) {
        allRegistrations = res.data;
        updateMetrics();
        renderTable();
      } else {
        showToast("Could not retrieve registrations.", "error");
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      showToast("Error connecting to data storage.", "error");
    } finally {
      if (tableLoading) tableLoading.style.display = "none";
    }
  }

  // ==========================================
  // 3. UPDATE METRIC COUNTERS
  // ==========================================
  function updateMetrics() {
    const total = allRegistrations.length;
    const countNew = allRegistrations.filter(r => r.registration_status === "New").length;
    const countContacted = allRegistrations.filter(r => r.registration_status === "Contacted").length;
    const countConfirmed = allRegistrations.filter(r => r.registration_status === "Confirmed").length;
    const countCompleted = allRegistrations.filter(r => r.registration_status === "Completed").length;

    if (metricTotal) metricTotal.textContent = total;
    if (metricNew) metricNew.textContent = countNew;
    if (metricContacted) metricContacted.textContent = countContacted;
    if (metricConfirmed) metricConfirmed.textContent = countConfirmed;

    if (badgeAll) badgeAll.textContent = total;
    if (badgeNew) badgeNew.textContent = countNew;
    if (badgeContacted) badgeContacted.textContent = countContacted;
    if (badgeConfirmed) badgeConfirmed.textContent = countConfirmed;
    if (badgeCompleted) badgeCompleted.textContent = countCompleted;
  }

  // ==========================================
  // 4. FILTER REGISTRATIONS
  // ==========================================
  function getFilteredRegistrations() {
    const query = (searchInput?.value || "").toLowerCase().trim();
    const selClass = filterClass?.value || "";
    const selBoard = filterBoard?.value || "";
    const selSubject = filterSubject?.value || "";
    const selStatus = filterStatus?.value || "";

    return allRegistrations.filter(r => {
      if (currentFilterStatus !== "all" && r.registration_status !== currentFilterStatus) {
        return false;
      }
      if (selStatus && r.registration_status !== selStatus) {
        return false;
      }
      if (selClass && r.class !== selClass) {
        return false;
      }
      if (selBoard && r.board !== selBoard) {
        return false;
      }
      if (selSubject) {
        const subjects = Array.isArray(r.subjects) ? r.subjects : [r.subjects];
        if (!subjects.includes(selSubject)) return false;
      }
      if (query) {
        const matchName = (r.student_name || "").toLowerCase().includes(query);
        const matchParent = (r.parent_name || "").toLowerCase().includes(query);
        const matchPhone = (r.phone || "").includes(query);
        const matchCode = (r.reg_code || "").toLowerCase().includes(query);
        const matchLocation = (r.location || "").toLowerCase().includes(query);
        if (!matchName && !matchParent && !matchPhone && !matchCode && !matchLocation) {
          return false;
        }
      }
      return true;
    });
  }

  // ==========================================
  // 5. RENDER TABLE
  // ==========================================
  function renderTable() {
    if (!tableBody) return;
    const filtered = getFilteredRegistrations();

    if (tableCountDisplay) {
      tableCountDisplay.textContent = `Showing ${filtered.length} of ${allRegistrations.length} student registration${allRegistrations.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 3.5rem 1rem; color: var(--text-muted);">
            <div style="font-size: 2.25rem; margin-bottom: 0.75rem; color: var(--text-muted); opacity: 0.6;">
              <i class="fa-regular fa-folder-open"></i>
            </div>
            <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-dark); margin-bottom: 0.35rem;">
              No registrations found
            </h4>
            <p style="font-size: 0.85rem; max-width: 420px; margin: 0 auto; color: var(--text-muted);">
              ${allRegistrations.length === 0 
                ? "No student registrations yet. When students register on the website, their details and slot bookings will appear here in real-time."
                : "No registrations match your active search or filter criteria. Try resetting your filters."}
            </p>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(r => {
      const regCode = r.reg_code || r.id;
      const subjectsStr = Array.isArray(r.subjects) ? r.subjects.join(", ") : (r.subjects || "None");
      const feeFormatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(r.monthly_fee || 0);

      const statusClass = `status-${(r.registration_status || "New").toLowerCase()}`;
      const directWaUrl = WhatsAppUtil.generateStudentDirectWhatsAppUrl(r.whatsapp || r.phone, r.student_name, regCode);

      const daysStr = Array.isArray(r.preferred_days) 
        ? r.preferred_days.map(d => d.slice(0, 3)).join(", ") 
        : (r.preferred_days || "Flexible");

      return `
        <tr data-id="${r.id || regCode}">
          <td>
            <span style="font-family: monospace; font-weight: 700; color: var(--accent); font-size: 0.88rem;">${regCode}</span>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(r.created_at || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</div>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--text-dark);">${escapeHtml(r.student_name)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(r.location || "Visakhapatnam")}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(r.class)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(r.board === 'Other' && r.board_other ? r.board_other : r.board)}</div>
          </td>
          <td>
            <span style="font-size: 0.82rem; background: var(--bg-surface-alt); padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-light); font-weight: 600;">
              ${escapeHtml(subjectsStr)}
            </span>
          </td>
          <td>
            <span style="font-weight: 800; color: var(--emerald);">${feeFormatted}</span>
            <div style="font-size: 0.72rem; color: var(--text-muted);">/ month</div>
          </td>
          <td>
            <div style="font-weight: 600; font-size: 0.85rem;">${escapeHtml(r.parent_name)}</div>
            <div style="font-size: 0.8rem; color: var(--text-body);">
              <a href="tel:${r.phone}" style="color: inherit;"><i class="fa-solid fa-phone" style="font-size: 0.75rem;"></i> ${r.phone}</a>
            </div>
          </td>
          <td>
            <div style="font-size: 0.82rem; font-weight: 600;">${escapeHtml(r.preferred_time_slot || "Evening")}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${daysStr}</div>
          </td>
          <td>
            <select class="form-select inline-status-select" data-id="${r.id || regCode}" style="padding: 0.25rem 0.5rem; font-size: 0.78rem; border-radius: var(--radius-pill); font-weight: 700; width: auto;">
              <option value="New" ${r.registration_status === 'New' ? 'selected' : ''}>New</option>
              <option value="Contacted" ${r.registration_status === 'Contacted' ? 'selected' : ''}>Contacted</option>
              <option value="Confirmed" ${r.registration_status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Completed" ${r.registration_status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Cancelled" ${r.registration_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <div class="table-actions">
              <a href="student.html?id=${encodeURIComponent(r.reg_code || r.id)}" class="action-btn" title="View Full Student Dossier">
                <i class="fa-regular fa-eye"></i> Details
              </a>
              <a href="${directWaUrl}" target="_blank" class="action-btn" style="color: #25D366; border-color: #bbf7d0;" title="Chat directly with Parent on WhatsApp">
                <i class="fa-brands fa-whatsapp"></i>
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Attach inline status change listeners
    document.querySelectorAll(".inline-status-select").forEach(sel => {
      sel.addEventListener("change", async function () {
        const id = this.getAttribute("data-id");
        const newStatus = this.value;
        const res = await EduNest.RegistrationService.updateRegistrationStatus(id, newStatus);
        if (res.success) {
          showToast(`Status updated to "${newStatus}"`, "success");
          loadRegistrations();
        } else {
          showToast("Failed to update status.", "error");
        }
      });
    });
  }

  function escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ==========================================
  // 6. EVENT LISTENERS
  // ==========================================
  if (searchInput) searchInput.addEventListener("input", renderTable);
  if (filterClass) filterClass.addEventListener("change", renderTable);
  if (filterBoard) filterBoard.addEventListener("change", renderTable);
  if (filterSubject) filterSubject.addEventListener("change", renderTable);
  if (filterStatus) filterStatus.addEventListener("change", renderTable);

  if (btnReset) {
    btnReset.addEventListener("click", function () {
      if (searchInput) searchInput.value = "";
      if (filterClass) filterClass.value = "";
      if (filterBoard) filterBoard.value = "";
      if (filterSubject) filterSubject.value = "";
      if (filterStatus) filterStatus.value = "";
      currentFilterStatus = "all";
      document.querySelectorAll(".admin-nav-link").forEach(l => l.classList.remove("active"));
      document.getElementById("navFilterAll")?.classList.add("active");
      renderTable();
      showToast("Filters reset", "info");
    });
  }

  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      loadRegistrations();
      showToast("Registrations refreshed", "info");
    });
  }

  // Sidebar Filter Links
  document.querySelectorAll(".admin-nav-link[data-filter]").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelectorAll(".admin-nav-link").forEach(l => l.classList.remove("active"));
      this.classList.add("active");
      currentFilterStatus = this.getAttribute("data-filter");
      renderTable();
    });
  });

  // ==========================================
  // 7. CSV EXPORT ENGINE
  // ==========================================
  if (btnExport) {
    btnExport.addEventListener("click", function () {
      if (allRegistrations.length === 0) {
        showToast("No registrations to export.", "info");
        return;
      }

      const headers = [
        "Registration ID", "Student Name", "Parent Name", "Class", "Board",
        "Subjects", "Subject Count", "Monthly Fee (INR)", "Phone", "WhatsApp",
        "Email", "Location", "Preferred Days", "Preferred Time Slot",
        "Status", "Teacher Notes", "Created At"
      ];

      const rows = allRegistrations.map(r => [
        `"${r.reg_code || r.id}"`,
        `"${(r.student_name || '').replace(/"/g, '""')}"`,
        `"${(r.parent_name || '').replace(/"/g, '""')}"`,
        `"${r.class || ''}"`,
        `"${(r.board === 'Other' && r.board_other ? r.board_other : r.board || '').replace(/"/g, '""')}"`,
        `"${(Array.isArray(r.subjects) ? r.subjects.join(', ') : r.subjects || '').replace(/"/g, '""')}"`,
        r.subject_count || 1,
        r.monthly_fee || 0,
        `"${r.phone || ''}"`,
        `"${r.whatsapp || ''}"`,
        `"${r.email || ''}"`,
        `"${(r.location || '').replace(/"/g, '""')}"`,
        `"${(Array.isArray(r.preferred_days) ? r.preferred_days.join(', ') : r.preferred_days || '').replace(/"/g, '""')}"`,
        `"${(r.preferred_time_slot || '').replace(/"/g, '""')}"`,
        `"${r.registration_status || 'New'}"`,
        `"${(r.teacher_notes || '').replace(/"/g, '""')}"`,
        `"${r.created_at || ''}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `edunest_tuition_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("CSV file exported successfully!", "success");
    });
  }

  // ==========================================
  // 8. PROFILE & ACCOUNT SETTINGS MODAL
  // ==========================================
  function openProfileModal() {
    if (!profileModal) return;
    const profile = EduNest.AuthService.getAdminProfile();
    if (modalProfileName) modalProfileName.textContent = profile.name || "K. Sarada";
    if (modalProfilePhone) modalProfilePhone.textContent = profile.phoneDisplay || "+91 90630 30342";
    if (modalProfileEmail) modalProfileEmail.textContent = profile.email || "edunest19@gmail.com";
    const modalNewEmailInput = document.getElementById("modalNewEmail");
    if (modalNewEmailInput) modalNewEmailInput.value = "";
    profileModal.classList.add("active");
  }

  function closeProfileModal() {
    if (profileModal) profileModal.classList.remove("active");
  }

  if (btnOpenProfile) btnOpenProfile.addEventListener("click", openProfileModal);
  if (btnSidebarSettings) btnSidebarSettings.addEventListener("click", openProfileModal);
  if (btnCloseProfile) btnCloseProfile.addEventListener("click", closeProfileModal);

  // Close on clicking modal backdrop
  if (profileModal) {
    profileModal.addEventListener("click", function (e) {
      if (e.target === profileModal) closeProfileModal();
    });
  }

  // Send Reset Link Button in Modal
  if (btnSendPasswordResetModal) {
    btnSendPasswordResetModal.addEventListener("click", async function () {
      const profile = EduNest.AuthService.getAdminProfile();
      const origText = this.innerHTML;
      this.disabled = true;
      this.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending Email...`;
      
      const res = await EduNest.AuthService.resetPassword(profile.email || "edunest19@gmail.com");
      if (res.success) {
        showToast(res.message, "success");
      } else {
        showToast(res.error || "Could not send reset email.", "error");
      }
      this.disabled = false;
      this.innerHTML = origText;
    });
  }

  // Change Password Form in Modal
  if (modalChangePasswordForm) {
    modalChangePasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const newPass = document.getElementById("modalNewPassword").value.trim();
      const confirmInput = document.getElementById("modalConfirmPassword");
      const confirmPass = confirmInput ? confirmInput.value.trim() : newPass;
      const submitBtn = document.getElementById("btnSaveModalPassword");
      const origText = submitBtn.innerHTML;

      if (!newPass || newPass.length < 6) {
        showToast("Password must be at least 6 characters.", "error");
        return;
      }

      if (confirmInput && newPass !== confirmPass) {
        showToast("Passwords do not match. Please re-enter.", "error");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating...`;

      const res = await EduNest.AuthService.updatePassword(newPass);
      if (res.success) {
        showToast("Password updated successfully!", "success");
        document.getElementById("modalNewPassword").value = "";
        if (confirmInput) confirmInput.value = "";
      } else {
        showToast(res.error || "Failed to update password.", "error");
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = origText;
    });
  }

  // Change Email Form in Modal
  if (modalChangeEmailForm) {
    modalChangeEmailForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const newEmail = document.getElementById("modalNewEmail").value.trim();
      const submitBtn = document.getElementById("btnSaveModalEmail");
      const origText = submitBtn.innerHTML;

      if (!newEmail || !newEmail.includes("@")) {
        showToast("Please enter a valid email address.", "error");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating...`;

      const res = await EduNest.AuthService.updateEmail(newEmail);
      if (res.success) {
        showToast(res.message, "success");
        if (modalProfileEmail) modalProfileEmail.textContent = newEmail;
        const sidebarEmail = document.getElementById("sidebarUserEmail");
        if (sidebarEmail) sidebarEmail.textContent = newEmail;
      } else {
        showToast(res.error || "Failed to update email.", "error");
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = origText;
    });
  }

  // Initial Data Load
  loadRegistrations();

});
