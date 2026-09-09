/**
 * EduNest - Teacher Admin Authentication Module
 * Manages Email/Mobile Login, Supabase Auth session, Google OAuth,
 * Password Reset via Email, Email Updates, and Route Protection.
 */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const isLoginPage = window.location.pathname.endsWith("login.html");
  
  // Auth UI Elements
  const viewLogin = document.getElementById("viewLogin");
  const viewForgotPassword = document.getElementById("viewForgotPassword");
  const viewChangeEmail = document.getElementById("viewChangeEmail");
  const viewRecoveryPassword = document.getElementById("viewRecoveryPassword");
  const authAlertBox = document.getElementById("authAlertBox");

  const loginForm = document.getElementById("adminLoginForm");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const changeEmailForm = document.getElementById("changeEmailForm");
  const recoveryPasswordForm = document.getElementById("recoveryPasswordForm");

  const linkForgotPassword = document.getElementById("linkForgotPassword");
  const linkChangeEmail = document.getElementById("linkChangeEmail");
  const linksBackToLogin = document.querySelectorAll(".link-back-to-login");
  const btnGoogleSignIn = document.getElementById("btnGoogleSignIn");
  const btnTogglePassword = document.getElementById("btnTogglePassword");
  const logoutBtn = document.getElementById("adminLogoutBtn");

  // Helper to show inline alerts
  function showAlert(message, type = "error") {
    if (!authAlertBox) return;
    authAlertBox.className = `auth-alert-box auth-alert-${type}`;
    const icon = type === "success" 
      ? "fa-circle-check" 
      : type === "info" 
        ? "fa-circle-info" 
        : "fa-triangle-exclamation";
    authAlertBox.innerHTML = `<i class="fa-solid ${icon}"></i> <div>${message}</div>`;
    authAlertBox.style.display = "flex";
  }

  function hideAlert() {
    if (authAlertBox) authAlertBox.style.display = "none";
  }

  // Switch between view panels on login page
  function switchView(targetView) {
    hideAlert();
    [viewLogin, viewForgotPassword, viewChangeEmail, viewRecoveryPassword].forEach(v => {
      if (v) v.classList.remove("active");
    });
    if (targetView) targetView.classList.add("active");
  }

  // Check if URL has password recovery hash/params (from Supabase password reset link)
  if (isLoginPage) {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    if (hash.includes("type=recovery") || search.includes("type=recovery")) {
      switchView(viewRecoveryPassword);
      showAlert("Password reset verified. Please set your new password below.", "info");
    }

    if (window.EduNest && window.EduNest.supabaseClient) {
      try {
        window.EduNest.supabaseClient.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY") {
            switchView(viewRecoveryPassword);
            showAlert("Password reset verified. Please enter your new password below.", "info");
          }
        });
      } catch (e) {
        console.warn("Auth state change listener init:", e);
      }
    }
  }

  // Route Protection: If on dashboard or student page, verify auth
  if (!isLoginPage) {
    if (!EduNest.AuthService.isAuthenticated()) {
      window.location.href = "login.html";
      return;
    }

    // Populate active admin teacher info in sidebar
    const profile = EduNest.AuthService.getAdminProfile();
    const user = EduNest.AuthService.getUser();
    const userEmailEl = document.getElementById("sidebarUserEmail");
    const userNameEl = document.getElementById("sidebarUserName");
    
    const activeEmail = (user && user.email) || profile.email || "edunest19@gmail.com";
    const activeName = (user && user.name) || profile.name || "K. Sarada";

    if (userEmailEl) userEmailEl.textContent = activeEmail;
    if (userNameEl) userNameEl.textContent = activeName;
  }

  // If already logged in and on login.html (without recovery mode), redirect to dashboard
  if (isLoginPage && EduNest.AuthService.isAuthenticated() && !window.location.hash.includes("type=recovery")) {
    window.location.href = "dashboard.html";
    return;
  }

  // ==========================================
  // VIEW NAVIGATION CLICK LISTENERS
  // ==========================================
  if (linkForgotPassword) {
    linkForgotPassword.addEventListener("click", function (e) {
      e.preventDefault();
      switchView(viewForgotPassword);
    });
  }

  if (linkChangeEmail) {
    linkChangeEmail.addEventListener("click", function (e) {
      e.preventDefault();
      switchView(viewChangeEmail);
    });
  }

  linksBackToLogin.forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      switchView(viewLogin);
    });
  });

  // Password visibility toggle
  if (btnTogglePassword) {
    btnTogglePassword.addEventListener("click", function () {
      const passInput = document.getElementById("adminPassword");
      if (passInput) {
        const isPassword = passInput.type === "password";
        passInput.type = isPassword ? "text" : "password";
        this.innerHTML = isPassword 
          ? `<i class="fa-regular fa-eye-slash"></i>` 
          : `<i class="fa-regular fa-eye"></i>`;
      }
    });
  }

  // ==========================================
  // 1. PRIMARY LOGIN SUBMISSION (Email or Mobile)
  // ==========================================
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideAlert();

      const identifier = document.getElementById("adminIdentifier").value.trim();
      const password = document.getElementById("adminPassword").value.trim();
      const submitBtn = document.getElementById("btnLoginSubmit");
      const originalText = submitBtn.innerHTML;

      if (!identifier || !password) {
        showAlert("Please enter your registered email/mobile and password.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;

      try {
        const result = await EduNest.AuthService.login(identifier, password);

        if (result.success) {
          showAlert("Sign in successful! Redirecting...", "success");
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 400);
        } else {
          showAlert(result.error || "Authentication failed. Please verify your credentials.");
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      } catch (err) {
        console.error("Login exception:", err);
        showAlert("An unexpected error occurred during login. Please try again.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // ==========================================
  // 2. GOOGLE / GMAIL SIGN IN
  // ==========================================
  if (btnGoogleSignIn) {
    btnGoogleSignIn.addEventListener("click", async function () {
      hideAlert();
      const origText = this.innerHTML;
      this.disabled = true;
      this.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Connecting with Google...`;

      try {
        const result = await EduNest.AuthService.signInWithGoogle();
        if (!result.success) {
          showAlert(result.error || "Google Sign-In requires active Supabase project keys in js/config.js.");
          this.disabled = false;
          this.innerHTML = origText;
        }
      } catch (err) {
        console.error("Google sign in exception", err);
        showAlert("Google Sign In could not be initiated.");
        this.disabled = false;
        this.innerHTML = origText;
      }
    });
  }

  // ==========================================
  // 3. FORGOT / RESET PASSWORD FORM
  // ==========================================
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideAlert();

      const email = document.getElementById("resetEmail").value.trim();
      const submitBtn = document.getElementById("btnSendResetEmail");
      const origText = submitBtn.innerHTML;

      if (!email) {
        showAlert("Please enter your registered email address.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending Link...`;

      try {
        const result = await EduNest.AuthService.resetPassword(email);
        if (result.success) {
          showAlert(result.message, "success");
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Email Sent!`;
        } else {
          showAlert(result.error || "Could not send password reset email.");
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }
      } catch (err) {
        showAlert("Failed to send reset email. Please try again.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // ==========================================
  // 4. CHANGE / UPDATE ADMIN EMAIL FORM
  // ==========================================
  if (changeEmailForm) {
    changeEmailForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideAlert();

      const currentPass = document.getElementById("currentPasswordForEmail").value.trim();
      const newEmail = document.getElementById("newAdminEmail").value.trim();
      const submitBtn = document.getElementById("btnUpdateEmailSubmit");
      const origText = submitBtn.innerHTML;

      if (!currentPass || !newEmail) {
        showAlert("Please enter both your current password and the new email address.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating Email...`;

      // Verify current credentials
      const profile = EduNest.AuthService.getAdminProfile();
      const loginCheck = await EduNest.AuthService.login(profile.email || "edunest19@gmail.com", currentPass);
      
      if (!loginCheck.success) {
        showAlert("Current password verification failed. Please check your password.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
        return;
      }

      try {
        const result = await EduNest.AuthService.updateEmail(newEmail);
        if (result.success) {
          showAlert(result.message, "success");
          document.getElementById("adminIdentifier").value = newEmail;
          setTimeout(() => {
            switchView(viewLogin);
          }, 1500);
        } else {
          showAlert(result.error || "Could not update email.");
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }
      } catch (err) {
        showAlert("Email update failed. Please try again.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // ==========================================
  // 5. RECOVERY SET NEW PASSWORD FORM
  // ==========================================
  if (recoveryPasswordForm) {
    recoveryPasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideAlert();

      const newPass = document.getElementById("recoveryNewPassword").value.trim();
      const confirmPass = document.getElementById("recoveryConfirmPassword").value.trim();
      const submitBtn = document.getElementById("btnSaveNewPassword");
      const origText = submitBtn.innerHTML;

      if (newPass.length < 6) {
        showAlert("Password must be at least 6 characters long.");
        return;
      }

      if (newPass !== confirmPass) {
        showAlert("Passwords do not match. Please re-enter.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving Password...`;

      try {
        const result = await EduNest.AuthService.updatePassword(newPass);
        if (result.success) {
          showAlert("Password changed successfully! Signing you into the dashboard...", "success");
          const profile = EduNest.AuthService.getAdminProfile();
          await EduNest.AuthService.login(profile.email, newPass);
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 800);
        } else {
          showAlert(result.error || "Failed to update password.");
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }
      } catch (err) {
        showAlert("Password update failed. Please try again.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // ==========================================
  // 6. LOGOUT HANDLER
  // ==========================================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      if (confirm("Are you sure you want to log out of the Teacher Portal?")) {
        await EduNest.AuthService.logout();
        window.location.href = "login.html";
      }
    });
  }

});
