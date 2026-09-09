/**
 * EduNest - Multi-Step Registration Controller
 * Handles wizard progression, validations, live fee recalculation,
 * and Supabase insertion with redirect to WhatsApp success page.
 */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // State
  let currentStep = 1;
  const totalSteps = 4;

  const form = document.getElementById("tuitionRegistrationForm");
  const progressFill = document.getElementById("progressFill");

  // Step containers
  const steps = [
    document.getElementById("wizardStep1"),
    document.getElementById("wizardStep2"),
    document.getElementById("wizardStep3"),
    document.getElementById("wizardStep4")
  ];

  const indicators = [
    document.getElementById("stepIndicator1"),
    document.getElementById("stepIndicator2"),
    document.getElementById("stepIndicator3"),
    document.getElementById("stepIndicator4")
  ];

  // ==========================================
  // 1. PRE-POPULATE FROM URL SEARCH PARAMS
  // ==========================================
  const urlParams = new URLSearchParams(window.location.search);
  const preClass = urlParams.get("class");
  const preSubjects = urlParams.get("subjects");

  if (preClass) {
    const classRadio = document.querySelector(`input[name="academic_class"][value*="${preClass}"]`);
    if (classRadio) classRadio.checked = true;
  }

  if (preSubjects) {
    const checkboxes = document.querySelectorAll(".subject-checkbox");
    if (preSubjects === "1") {
      checkboxes[0].checked = true; // Physics
    } else if (preSubjects === "2") {
      checkboxes[0].checked = true; // Physics
      checkboxes[2].checked = true; // Mathematics
    } else if (preSubjects === "3") {
      checkboxes.forEach(cb => cb.checked = true);
    }
  }

  // ==========================================
  // 2. EDUCATION BOARDS
  // ==========================================
  const boardSelect = document.getElementById("educationBoard");

  // ==========================================
  // 3. LIVE SUBJECT & FEE CALCULATION
  // ==========================================
  const subjectCheckboxes = document.querySelectorAll(".subject-checkbox");
  const classRadios = document.querySelectorAll('input[name="academic_class"]');
  const liveSubjectLabel = document.getElementById("liveSubjectLabel");
  const liveFeeAmount = document.getElementById("liveFeeAmount");

  function calculateFee() {
    const selected = Array.from(subjectCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    const count = selected.length;
    const selectedClassRadio = document.querySelector('input[name="academic_class"]:checked');
    const academicClass = selectedClassRadio ? selectedClassRadio.value : "";
    let fee = CONFIG.getFee(academicClass, count);

    if (count === 0) {
      if (liveSubjectLabel) liveSubjectLabel.textContent = "Please select at least 1 subject";
      if (liveFeeAmount) liveFeeAmount.textContent = "Select Subject";
      renderTimeSlots(1);
    } else {
      const classText = academicClass ? `(${academicClass})` : '';
      if (count === 1) {
        if (liveSubjectLabel) liveSubjectLabel.textContent = `${selected[0]} (1 Subject) ${classText}`.trim();
        if (liveFeeAmount) liveFeeAmount.textContent = `₹${fee.toLocaleString("en-IN")} / mo`;
      } else if (count === 2) {
        if (liveSubjectLabel) liveSubjectLabel.textContent = `${selected.join(" + ")} (2 Subjects) ${classText}`.trim();
        if (liveFeeAmount) liveFeeAmount.textContent = `₹${fee.toLocaleString("en-IN")} / mo`;
      } else if (count >= 3) {
        if (liveSubjectLabel) liveSubjectLabel.textContent = `Complete PCM (${selected.join(" + ")}) ${classText}`.trim();
        if (liveFeeAmount) liveFeeAmount.textContent = `₹${fee.toLocaleString("en-IN")} / mo`;
      }
      renderTimeSlots(count);
    }

    return { selected, count, fee, academicClass };
  }

  // ==========================================
  // 4. DYNAMIC TIME SLOTS RENDERING & SELECTION
  // ==========================================
  const timeSlotsGrid = document.getElementById("timeSlotsGrid");
  const slotHelperNote = document.getElementById("slotHelperNote");
  let activeSelectedSlot = "";

  function renderTimeSlots(subjectCount = 1) {
    if (!timeSlotsGrid) return;
    const slots = CONFIG.getTimeSlots(subjectCount);

    if (slotHelperNote) {
      if (subjectCount >= 2) {
        slotHelperNote.innerHTML = `<i class="fa-solid fa-clock" style="color: var(--accent);"></i> Since you selected <strong>${subjectCount} subjects</strong>, <strong>2-hour batch slots</strong> are applicable (<strong>6:30 PM – 8:30 PM</strong> or <strong>7:00 PM – 9:00 PM</strong>).`;
      } else {
        slotHelperNote.innerHTML = `<i class="fa-solid fa-clock" style="color: var(--accent);"></i> Since you selected <strong>1 subject</strong>, <strong>1-hour batch slots</strong> are applicable (between <strong>6:30 PM and 9:00 PM</strong>).`;
      }
    }

    // Check if previous selected slot is valid in this slot list
    const isCurrentSlotValid = slots.some(s => s.slot === activeSelectedSlot);
    if (!isCurrentSlotValid) {
      activeSelectedSlot = slots[0].slot;
    }

    timeSlotsGrid.innerHTML = "";
    slots.forEach(s => {
      const card = document.createElement("div");
      const isSelected = s.slot === activeSelectedSlot;
      card.className = `slot-card ${isSelected ? "selected" : ""}`;
      card.setAttribute("data-slot", s.slot);
      card.setAttribute("data-period", s.period);
      card.innerHTML = `
        <div class="slot-period"><i class="fa-solid fa-moon"></i> ${s.period} (${s.duration || 'Evening'})</div>
        <div class="slot-time">${s.slot}</div>
      `;
      card.addEventListener("click", function () {
        document.querySelectorAll("#timeSlotsGrid .slot-card").forEach(c => c.classList.remove("selected"));
        this.classList.add("selected");
        activeSelectedSlot = s.slot;
      });
      timeSlotsGrid.appendChild(card);
    });
  }

  subjectCheckboxes.forEach(cb => {
    cb.addEventListener("change", calculateFee);
  });
  classRadios.forEach(rb => {
    rb.addEventListener("change", calculateFee);
  });
  calculateFee();

  // ==========================================
  // 5. "SAME AS PHONE" CHECKBOX SYNC
  // ==========================================
  const phoneInput = document.getElementById("phoneNumber");
  const whatsappInput = document.getElementById("whatsappNumber");
  const sameAsPhoneCheckbox = document.getElementById("sameAsPhoneCheckbox");

  if (sameAsPhoneCheckbox && phoneInput && whatsappInput) {
    sameAsPhoneCheckbox.addEventListener("change", function () {
      if (this.checked) {
        whatsappInput.value = phoneInput.value;
        whatsappInput.readOnly = true;
        whatsappInput.style.backgroundColor = "var(--bg-surface-alt)";
      } else {
        whatsappInput.readOnly = false;
        whatsappInput.style.backgroundColor = "var(--bg-surface)";
      }
    });

    phoneInput.addEventListener("input", function () {
      if (sameAsPhoneCheckbox.checked) {
        whatsappInput.value = this.value;
      }
    });
  }

  // ==========================================
  // 6. PREFERRED DAYS CHIPS TOGGLE
  // ==========================================
  const dayChips = document.querySelectorAll("#daysChipGroup .day-chip");
  dayChips.forEach(chip => {
    chip.addEventListener("click", function () {
      this.classList.toggle("selected");
    });
  });

  // ==========================================
  // 7. STEP NAVIGATION & VALIDATIONS
  // ==========================================
  function updateStepUI(stepIndex) {
    currentStep = stepIndex;

    // Show active step container
    steps.forEach((s, idx) => {
      if (idx === stepIndex - 1) {
        s.classList.add("active");
      } else {
        s.classList.remove("active");
      }
    });

    // Update Progress bar fill
    const percent = ((stepIndex - 1) / (totalSteps - 1)) * 100;
    if (progressFill) progressFill.style.width = `${percent}%`;

    // Update Indicators
    indicators.forEach((ind, idx) => {
      if (idx + 1 < stepIndex) {
        ind.className = "progress-step completed";
      } else if (idx + 1 === stepIndex) {
        ind.className = "progress-step active";
      } else {
        ind.className = "progress-step";
      }
    });

    window.scrollTo({ top: 120, behavior: "smooth" });
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
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  // --- Step 1 Validation ---
  function validateStep1() {
    let isValid = true;

    // Student Name
    const studentName = document.getElementById("studentName");
    const nameErr = document.getElementById("studentNameError");
    if (!studentName.value.trim()) {
      studentName.classList.add("is-invalid");
      if (nameErr) nameErr.style.display = "block";
      isValid = false;
    } else {
      studentName.classList.remove("is-invalid");
      if (nameErr) nameErr.style.display = "none";
    }

    // Academic Class
    const classChecked = document.querySelector('input[name="academic_class"]:checked');
    const classErr = document.getElementById("classError");
    if (!classChecked) {
      if (classErr) classErr.style.display = "block";
      isValid = false;
    } else {
      if (classErr) classErr.style.display = "none";
    }

    // Education Board
    const board = document.getElementById("educationBoard");
    const boardErr = document.getElementById("boardError");
    if (!board.value) {
      board.classList.add("is-invalid");
      if (boardErr) boardErr.style.display = "block";
      isValid = false;
    } else {
      board.classList.remove("is-invalid");
      if (boardErr) boardErr.style.display = "none";
    }

    // Subjects
    const subjectsChecked = document.querySelectorAll(".subject-checkbox:checked");
    const subjectErr = document.getElementById("subjectError");
    if (subjectsChecked.length === 0) {
      if (subjectErr) subjectErr.style.display = "block";
      isValid = false;
    } else {
      if (subjectErr) subjectErr.style.display = "none";
    }

    return isValid;
  }

  // --- Step 2 Validation ---
  function validateStep2() {
    let isValid = true;

    // Parent Name
    const parentName = document.getElementById("parentName");
    const parentErr = document.getElementById("parentNameError");
    if (!parentName.value.trim()) {
      parentName.classList.add("is-invalid");
      if (parentErr) parentErr.style.display = "block";
      isValid = false;
    } else {
      parentName.classList.remove("is-invalid");
      if (parentErr) parentErr.style.display = "none";
    }

    // Parent Primary Phone (10 digits, Mandatory)
    const phone = document.getElementById("phoneNumber");
    const phoneErr = document.getElementById("phoneError");
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.value.replace(/[^0-9]/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      phone.classList.add("is-invalid");
      if (phoneErr) phoneErr.style.display = "block";
      isValid = false;
    } else {
      phone.classList.remove("is-invalid");
      if (phoneErr) phoneErr.style.display = "none";
    }

    // Parent WhatsApp Phone (10 digits, Mandatory)
    const whatsapp = document.getElementById("whatsappNumber");
    const whatsappErr = document.getElementById("whatsappError");
    const cleanWhatsapp = whatsapp.value.replace(/[^0-9]/g, "");
    if (!phoneRegex.test(cleanWhatsapp)) {
      whatsapp.classList.add("is-invalid");
      if (whatsappErr) whatsappErr.style.display = "block";
      isValid = false;
    } else {
      whatsapp.classList.remove("is-invalid");
      if (whatsappErr) whatsappErr.style.display = "none";
    }

    // Student Mobile (Optional, validate if entered)
    const studentPhone = document.getElementById("studentPhone");
    const studentPhoneErr = document.getElementById("studentPhoneError");
    if (studentPhone && studentPhone.value.trim()) {
      const cleanStudentPhone = studentPhone.value.replace(/[^0-9]/g, "");
      if (!phoneRegex.test(cleanStudentPhone)) {
        studentPhone.classList.add("is-invalid");
        if (studentPhoneErr) studentPhoneErr.style.display = "block";
        isValid = false;
      } else {
        studentPhone.classList.remove("is-invalid");
        if (studentPhoneErr) studentPhoneErr.style.display = "none";
      }
    } else if (studentPhone) {
      studentPhone.classList.remove("is-invalid");
      if (studentPhoneErr) studentPhoneErr.style.display = "none";
    }

    // Email (Optional, but validate if entered)
    const email = document.getElementById("emailAddress");
    const emailErr = document.getElementById("emailError");
    if (email.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.value.trim())) {
        email.classList.add("is-invalid");
        if (emailErr) emailErr.style.display = "block";
        isValid = false;
      } else {
        email.classList.remove("is-invalid");
        if (emailErr) emailErr.style.display = "none";
      }
    }

    // Location / Residential Area
    const location = document.getElementById("residentialLocation");
    const locationErr = document.getElementById("locationError");
    if (!location.value.trim() || location.value.trim().length < 3) {
      location.classList.add("is-invalid");
      if (locationErr) locationErr.style.display = "block";
      isValid = false;
    } else {
      location.classList.remove("is-invalid");
      if (locationErr) locationErr.style.display = "none";
    }

    return isValid;
  }

  // --- Step 3 Validation ---
  function validateStep3() {
    let isValid = true;

    // Preferred Days
    const selectedDays = document.querySelectorAll("#daysChipGroup .day-chip.selected");
    const daysErr = document.getElementById("daysError");
    if (selectedDays.length === 0) {
      if (daysErr) daysErr.style.display = "block";
      isValid = false;
    } else {
      if (daysErr) daysErr.style.display = "none";
    }

    // Preferred Time Slot
    const selectedSlot = document.querySelector("#timeSlotsGrid .slot-card.selected");
    const slotErr = document.getElementById("slotError");
    if (!selectedSlot) {
      if (slotErr) slotErr.style.display = "block";
      isValid = false;
    } else {
      if (slotErr) slotErr.style.display = "none";
    }

    return isValid;
  }

  // --- Populate Step 4 Review ---
  function populateReview() {
    const studentName = document.getElementById("studentName").value.trim();
    const classChecked = document.querySelector('input[name="academic_class"]:checked');
    const board = document.getElementById("educationBoard").value;
    const { selected: subjects, fee } = calculateFee();

    const parentName = document.getElementById("parentName").value.trim();
    const phone = document.getElementById("phoneNumber").value.trim();
    const whatsapp = document.getElementById("whatsappNumber").value.trim();
    const studentPhone = document.getElementById("studentPhone")?.value.trim();
    const location = document.getElementById("residentialLocation").value.trim();

    const selectedDays = Array.from(document.querySelectorAll("#daysChipGroup .day-chip.selected"))
      .map(c => c.getAttribute("data-day"));
    
    const selectedSlotEl = document.querySelector("#timeSlotsGrid .slot-card.selected");
    const slot = selectedSlotEl ? selectedSlotEl.getAttribute("data-slot") : "7:30 PM – 8:30 PM";
    const period = selectedSlotEl ? selectedSlotEl.getAttribute("data-period") : "Evening";
    const message = document.getElementById("additionalRequirements").value.trim();

    // Populate DOM Review elements
    document.getElementById("reviewStudentName").textContent = studentName;
    document.getElementById("reviewClass").textContent = classChecked ? classChecked.value : "-";
    document.getElementById("reviewBoard").textContent = board || "-";
    document.getElementById("reviewSubjects").textContent = `${subjects.join(", ")} (${subjects.length} Subject${subjects.length > 1 ? 's' : ''})`;

    document.getElementById("reviewParentName").textContent = parentName;
    document.getElementById("reviewPhone").textContent = phone;
    if (document.getElementById("reviewWhatsapp")) document.getElementById("reviewWhatsapp").textContent = whatsapp;
    if (document.getElementById("reviewStudentPhone")) document.getElementById("reviewStudentPhone").textContent = studentPhone || "Not Provided";
    document.getElementById("reviewLocation").textContent = location;

    document.getElementById("reviewDays").textContent = selectedDays.join(", ");
    document.getElementById("reviewSlot").textContent = `${slot} (${period})`;
    document.getElementById("reviewMessage").textContent = message || "None specified";

    document.getElementById("reviewFeeSubjectsLabel").textContent = `${subjects.join(" + ")} (${subjects.length} Subject${subjects.length > 1 ? 's' : ''})`;
    document.getElementById("reviewFeeAmount").textContent = `₹${fee.toLocaleString("en-IN")} / mo`;
  }

  // --- Step Navigation Buttons Click Handlers ---
  document.getElementById("btnStep1Next")?.addEventListener("click", () => {
    if (validateStep1()) updateStepUI(2);
  });

  document.getElementById("btnStep2Prev")?.addEventListener("click", () => updateStepUI(1));
  document.getElementById("btnStep2Next")?.addEventListener("click", () => {
    if (validateStep2()) updateStepUI(3);
  });

  document.getElementById("btnStep3Prev")?.addEventListener("click", () => updateStepUI(2));
  document.getElementById("btnStep3Next")?.addEventListener("click", () => {
    if (validateStep3()) {
      populateReview();
      updateStepUI(4);
    }
  });

  document.getElementById("btnStep4Prev")?.addEventListener("click", () => updateStepUI(3));

  // ==========================================
  // 8. FINAL FORM SUBMISSION & SUPABASE INSERT
  // ==========================================
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Re-verify all steps
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      showToast("Please ensure all required fields are correctly filled.", "error");
      return;
    }

    const submitBtn = document.getElementById("btnSubmitRegistration");
    const originalBtnText = submitBtn.innerHTML;

    // Loading State
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting Registration...`;

    // Construct Payload
    const studentName = document.getElementById("studentName").value.trim();
    const academicClass = document.querySelector('input[name="academic_class"]:checked').value;
    const board = document.getElementById("educationBoard").value;
    const { selected: subjects, count: subjectCount, fee: monthlyFee } = calculateFee();

    const parentName = document.getElementById("parentName").value.trim();
    const phone = document.getElementById("phoneNumber").value.trim();
    const whatsapp = document.getElementById("whatsappNumber").value.trim();
    const studentPhone = document.getElementById("studentPhone")?.value.trim() || null;
    const email = document.getElementById("emailAddress").value.trim();
    const location = document.getElementById("residentialLocation").value.trim();

    const selectedDays = Array.from(document.querySelectorAll("#daysChipGroup .day-chip.selected"))
      .map(c => c.getAttribute("data-day"));
    
    const selectedSlotEl = document.querySelector("#timeSlotsGrid .slot-card.selected");
    const slot = selectedSlotEl ? selectedSlotEl.getAttribute("data-slot") : "7:30 PM – 8:30 PM";
    const period = selectedSlotEl ? selectedSlotEl.getAttribute("data-period") : "Evening";
    const message = document.getElementById("additionalRequirements").value.trim();

    const registrationData = {
      student_name: studentName,
      parent_name: parentName,
      class: academicClass,
      board: board,
      board_other: null,
      subjects: subjects,
      subject_count: subjectCount,
      monthly_fee: monthlyFee,
      phone: phone,
      whatsapp: whatsapp || phone,
      student_phone: studentPhone,
      email: email || null,
      location: location,
      preferred_days: selectedDays,
      preferred_time_period: period,
      preferred_time_slot: slot,
      additional_message: message || null
    };

    try {
      // Insert to Supabase / Local Data Layer
      const result = await EduNest.RegistrationService.createRegistration(registrationData);

      if (result.success && result.data) {
        // Save to Session Storage for success page retrieval
        sessionStorage.setItem("edunest_last_registration", JSON.stringify(result.data));

        // Auto redirect to success confirmation page
        window.location.href = `success.html?id=${result.data.reg_code || result.data.id}`;
      } else {
        throw new Error(result.error || "Submission could not be completed.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      showToast("Something went wrong while submitting your registration. Please try again.", "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });

});
