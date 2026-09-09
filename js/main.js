/**
 * EduNest - Home Page Main Script
 * Handles Navigation, FAQ Accordions, Hero Interactive Fee Calculator,
 * and Dynamic Configuration hydration.
 */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // ==========================================
  // 1. HYDRATE TEACHER CONTACT FROM CONFIG
  // ==========================================
  if (window.CONFIG && CONFIG.TEACHER) {
    const teacherNameEl = document.getElementById("heroTeacherName");
    const teacherQualEl = document.getElementById("heroTeacherQual");
    if (teacherNameEl) teacherNameEl.textContent = CONFIG.TEACHER.name;
    if (teacherQualEl) teacherQualEl.textContent = CONFIG.TEACHER.qualification;
  }

  // ==========================================
  // 2. MOBILE NAVIGATION MENU TOGGLE
  // ==========================================
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  const navLinks = document.querySelectorAll(".nav-link");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      mainNav.classList.toggle("menu-open");
      const icon = navToggle.querySelector("i");
      if (icon) {
        if (mainNav.classList.contains("menu-open")) {
          icon.className = "fa-solid fa-xmark";
        } else {
          icon.className = "fa-solid fa-bars";
        }
      }
    });

    // Close menu when link is clicked
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("menu-open");
        const icon = navToggle.querySelector("i");
        if (icon) icon.className = "fa-solid fa-bars";
      });
    });
  }

  // ==========================================
  // 3. STICKY NAVBAR SCROLL EFFECT
  // ==========================================
  window.addEventListener("scroll", function () {
    if (window.scrollY > 30) {
      mainNav.classList.add("scrolled");
    } else {
      mainNav.classList.remove("scrolled");
    }
  });

  // ==========================================
  // 4. FAQ ACCORDION INTERACTIVITY
  // ==========================================
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    if (question) {
      question.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        // Close other FAQs
        faqItems.forEach(otherItem => {
          otherItem.classList.remove("active");
        });
        // Toggle current
        if (!isActive) {
          item.classList.add("active");
        }
      });
    }
  });

  // ==========================================
  // 5. HERO INSTANT FEE ESTIMATOR WIDGET
  // ==========================================
  const subjectChips = document.querySelectorAll("#heroSubjectChips .qc-chip");
  const classToggleBtns = document.querySelectorAll("#heroClassToggle .qc-class-btn");
  const heroFeeDisplay = document.getElementById("heroFeeDisplay");
  const heroSubjectCountText = document.getElementById("heroSubjectCountText");

  let currentHeroClassGroup = "foundation"; // "foundation" (8th-10th) or "senior" (11th-12th)

  function updateHeroCalculator() {
    const selectedChips = document.querySelectorAll("#heroSubjectChips .qc-chip.selected");
    const count = selectedChips.length;
    const isSenior = currentHeroClassGroup === "senior";
    const groupLabel = isSenior ? "11th & 12th" : "8th – 10th";

    let fee = 0;
    if (window.CONFIG && CONFIG.FEES) {
      const tier = isSenior ? CONFIG.FEES.senior : CONFIG.FEES.foundation;
      if (count === 1) fee = tier[1];
      else if (count === 2) fee = tier[2];
      else if (count >= 3) fee = tier[3];
    } else {
      // Fallback
      if (isSenior) {
        fee = count === 1 ? 1499 : count === 2 ? 2999 : count >= 3 ? 3999 : 0;
      } else {
        fee = count === 1 ? 999 : count === 2 ? 1999 : count >= 3 ? 2499 : 0;
      }
    }

    let feeText = "Select Subject";
    let countLabel = "0 Subjects Selected";

    if (count === 0) {
      feeText = "₹0";
      countLabel = `Select at least 1 subject (${groupLabel})`;
    } else if (count === 1) {
      feeText = `₹${fee.toLocaleString("en-IN")} <span style='font-size: 0.8rem; font-weight: 500; color: var(--text-muted);'>/ mo</span>`;
      countLabel = `1 Subject Selected (${groupLabel})`;
    } else if (count === 2) {
      feeText = `₹${fee.toLocaleString("en-IN")} <span style='font-size: 0.8rem; font-weight: 500; color: var(--text-muted);'>/ mo</span>`;
      countLabel = `2 Subjects Selected (${groupLabel})`;
    } else if (count >= 3) {
      feeText = `₹${fee.toLocaleString("en-IN")} <span style='font-size: 0.8rem; font-weight: 500; color: var(--text-muted);'>/ mo</span>`;
      countLabel = `3 Subjects PCM (${groupLabel})`;
    }

    if (heroFeeDisplay) heroFeeDisplay.innerHTML = feeText;
    if (heroSubjectCountText) heroSubjectCountText.textContent = countLabel;
  }

  classToggleBtns.forEach(btn => {
    btn.addEventListener("click", function () {
      classToggleBtns.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      currentHeroClassGroup = this.getAttribute("data-class-group") || "foundation";
      updateHeroCalculator();
    });
  });

  subjectChips.forEach(chip => {
    chip.addEventListener("click", function () {
      chip.classList.toggle("selected");
      // Ensure at least 1 remains selected for best UX
      const currentlySelected = document.querySelectorAll("#heroSubjectChips .qc-chip.selected");
      if (currentlySelected.length === 0) {
        chip.classList.add("selected");
      }
      updateHeroCalculator();
    });
  });

  // Initial calculation
  updateHeroCalculator();

  // ==========================================
  // 6. FEE STRUCTURE SECTION TABS
  // ==========================================
  const feeTabBtns = document.querySelectorAll("#feeTierTabs .fee-tab-btn");
  const feePanels = {
    foundation: document.getElementById("feePanelFoundation"),
    senior: document.getElementById("feePanelSenior")
  };

  feeTabBtns.forEach(tab => {
    tab.addEventListener("click", function () {
      const targetTier = this.getAttribute("data-tier");
      feeTabBtns.forEach(t => t.classList.remove("active"));
      this.classList.add("active");

      Object.keys(feePanels).forEach(key => {
        if (feePanels[key]) {
          if (key === targetTier) {
            feePanels[key].classList.add("active");
          } else {
            feePanels[key].classList.remove("active");
          }
        }
      });
    });
  });
});
