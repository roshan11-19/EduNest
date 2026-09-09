/**
 * EduNest - Teacher Admin Student Detail Script
 * Manages loading student dossier, status progression workflows,
 * teacher notes persistence, and direct parent WhatsApp trigger.
 */

document.addEventListener("DOMContentLoaded", async function () {
  "use strict";

  // Auth Guard
  if (!EduNest.AuthService.isAuthenticated()) return;

  const urlParams = new URLSearchParams(window.location.search);
  const regId = urlParams.get("id");

  const loadingContainer = document.getElementById("studentLoadingContainer");
  const contentGrid = document.getElementById("studentContentGrid");

  let currentRecord = null;

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

  if (!regId) {
    if (loadingContainer) {
      loadingContainer.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: var(--rose); margin-bottom: 1rem;"></i>
        <h3>No Registration ID Specified</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Please select a student from the dashboard.</p>
        <a href="dashboard.html" class="btn btn-primary">Return to Dashboard</a>
      `;
    }
    return;
  }

  // ==========================================
  // 1. FETCH STUDENT RECORD
  // ==========================================
  async function fetchStudentRecord() {
    try {
      const res = await EduNest.RegistrationService.getRegistrationById(regId);
      if (res.success && res.data) {
        currentRecord = res.data;
        renderStudentDetails(currentRecord);
      } else {
        if (loadingContainer) {
          loadingContainer.innerHTML = `
            <i class="fa-solid fa-circle-xmark" style="font-size: 2.5rem; color: var(--rose); margin-bottom: 1rem;"></i>
            <h3>Registration Not Found</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">The student registration record could not be found.</p>
            <a href="dashboard.html" class="btn btn-secondary">Back to Dashboard</a>
          `;
        }
      }
    } catch (err) {
      console.error("Error fetching student profile:", err);
      showToast("Error retrieving student record.", "error");
    }
  }

  // ==========================================
  // 2. RENDER DETAILS TO DOM
  // ==========================================
  function renderStudentDetails(record) {
    const regCode = record.reg_code || record.id;
    const headerTitle = document.getElementById("headerStudentName");
    if (headerTitle) headerTitle.textContent = `${record.student_name} (${regCode})`;

    // Academic Info
    document.getElementById("profStudentName").textContent = record.student_name;
    document.getElementById("profClass").textContent = record.class;
    
    const boardDisplay = record.board === "Other" && record.board_other 
      ? `${record.board_other} (Other)` 
      : record.board;
    document.getElementById("profBoard").textContent = boardDisplay;

    const subjectsDisplay = Array.isArray(record.subjects) 
      ? record.subjects.join(", ") 
      : record.subjects;
    document.getElementById("profSubjects").textContent = `${subjectsDisplay} (${record.subject_count || (Array.isArray(record.subjects) ? record.subjects.length : 1)} Subject${(record.subject_count > 1 || (Array.isArray(record.subjects) && record.subjects.length > 1)) ? 's' : ''})`;

    // Contact Info
    document.getElementById("profParentName").textContent = record.parent_name;
    
    const phoneLink = document.getElementById("profPhoneLink");
    if (phoneLink) {
      phoneLink.textContent = record.phone;
      phoneLink.href = `tel:${record.phone}`;
    }

    document.getElementById("profWhatsApp").textContent = record.whatsapp || record.phone;
    if (document.getElementById("profStudentMobile")) {
      document.getElementById("profStudentMobile").textContent = record.student_phone || "Not Provided";
    }
    document.getElementById("profEmail").textContent = record.email || "Not Provided";
    document.getElementById("profLocation").textContent = record.location;

    // Preferences
    const daysDisplay = Array.isArray(record.preferred_days) 
      ? record.preferred_days.join(", ") 
      : (record.preferred_days || "Flexible");
    document.getElementById("profDays").textContent = daysDisplay;
    document.getElementById("profTimeSlot").textContent = `${record.preferred_time_slot} (${record.preferred_time_period || 'Evening'})`;
    document.getElementById("profRequirements").textContent = record.additional_message || "No specific academic requirements provided.";

    // Meta & Status
    document.getElementById("profRegCode").textContent = regCode;
    
    const feeFormatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(record.monthly_fee || 0);
    document.getElementById("profFee").textContent = `${feeFormatted} / month`;

    document.getElementById("profDate").textContent = new Date(record.created_at || Date.now()).toLocaleDateString("en-IN", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
    });

    updateStatusBadge(record.registration_status || "New");

    // Teacher Notes
    const notesArea = document.getElementById("teacherNotesArea");
    if (notesArea) notesArea.value = record.teacher_notes || "";

    // WhatsApp Action Button
    const topWaBtn = document.getElementById("topStudentWhatsAppBtn");
    if (topWaBtn) {
      topWaBtn.href = WhatsAppUtil.generateStudentDirectWhatsAppUrl(record.whatsapp || record.phone, record.student_name, regCode);
    }

    // Reveal Grid
    if (loadingContainer) loadingContainer.style.display = "none";
    if (contentGrid) contentGrid.style.display = "grid";
  }

  function updateStatusBadge(status) {
    const badge = document.getElementById("badgeCurrentStatus");
    if (!badge) return;
    badge.textContent = status;
    badge.className = `status-badge status-${status.toLowerCase()}`;
  }

  // ==========================================
  // 3. STATUS UPDATE ACTION WORKFLOWS
  // ==========================================
  async function handleStatusChange(newStatus) {
    if (!currentRecord) return;
    const regCode = currentRecord.reg_code || currentRecord.id;

    try {
      const res = await EduNest.RegistrationService.updateRegistrationStatus(regCode, newStatus);
      if (res.success) {
        currentRecord.registration_status = newStatus;
        updateStatusBadge(newStatus);
        showToast(`Registration marked as "${newStatus}"`, "success");
      } else {
        showToast("Failed to update status in database.", "error");
      }
    } catch (e) {
      console.error("Status update error:", e);
      showToast("Error updating status.", "error");
    }
  }

  document.getElementById("btnStatusContacted")?.addEventListener("click", () => handleStatusChange("Contacted"));
  document.getElementById("btnStatusConfirmed")?.addEventListener("click", () => handleStatusChange("Confirmed"));
  document.getElementById("btnStatusCompleted")?.addEventListener("click", () => handleStatusChange("Completed"));
  document.getElementById("btnStatusCancelled")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to cancel this student registration?")) {
      handleStatusChange("Cancelled");
    }
  });

  // ==========================================
  // 4. SAVE TEACHER NOTES
  // ==========================================
  const saveNotesBtn = document.getElementById("btnSaveTeacherNotes");
  if (saveNotesBtn) {
    saveNotesBtn.addEventListener("click", async function () {
      if (!currentRecord) return;
      const notes = document.getElementById("teacherNotesArea").value.trim();
      const regCode = currentRecord.reg_code || currentRecord.id;
      const originalText = saveNotesBtn.innerHTML;

      saveNotesBtn.disabled = true;
      saveNotesBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

      try {
        const res = await EduNest.RegistrationService.updateRegistrationStatus(
          regCode,
          currentRecord.registration_status || "New",
          notes
        );

        if (res.success) {
          currentRecord.teacher_notes = notes;
          showToast("Teacher notes saved successfully!", "success");
        } else {
          showToast("Failed to save notes.", "error");
        }
      } catch (err) {
        console.error("Notes save exception:", err);
        showToast("Error saving notes.", "error");
      } finally {
        saveNotesBtn.disabled = false;
        saveNotesBtn.innerHTML = originalText;
      }
    });
  }

  // Load Record on page startup
  fetchStudentRecord();

});
