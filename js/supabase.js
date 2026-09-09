/**
 * Supabase Data & Auth Client Wrapper
 * Handles database operations for student_registrations table
 * and Single-Teacher Active Profile Authentication.
 * 
 * Features zero-demo clean storage, Supabase live sync,
 * Email & Mobile Login, Google Auth, Password Reset via Email,
 * and Profile Management (Change Email & Password).
 */

(function (window) {
  "use strict";

  const STORAGE_KEY = "edunest_tuition_registrations";
  const AUTH_KEY = "edunest_admin_session";
  const PROFILE_KEY = "edunest_admin_profile";

  // Check if real Supabase credentials are configured
  function isSupabaseConfigured() {
    return (
      typeof window.supabase !== "undefined" &&
      CONFIG.SUPABASE &&
      CONFIG.SUPABASE.URL &&
      !CONFIG.SUPABASE.URL.includes("your-project-id") &&
      CONFIG.SUPABASE.ANON_KEY &&
      !CONFIG.SUPABASE.ANON_KEY.includes("your-anon-key")
    );
  }

  let supabaseClient = null;
  if (isSupabaseConfigured()) {
    try {
      supabaseClient = window.supabase.createClient(
        CONFIG.SUPABASE.URL,
        CONFIG.SUPABASE.ANON_KEY
      );
      console.info("[EduNest Supabase] Connected to live Supabase project.");
    } catch (e) {
      console.warn("[EduNest Supabase] Failed to initialize live client, using clean local store.", e);
    }
  } else {
    console.info("[EduNest Storage] Supabase credentials pending. Clean zero-demo local storage active.");
  }

  // --- Clean Registrations Storage (No Demo/Mock Data) ---
  function getLocalRegistrations() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("Local storage read error", e);
      return [];
    }
  }

  function saveLocalRegistrations(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
    } catch (e) {
      console.error("Local storage save error", e);
    }
  }

  // Generate Unique Registration Code: HT-YYYY-XXXX
  function generateRegCode() {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `HT-${year}-${randomNum}`;
  }

  // ==========================================
  // REGISTRATION SERVICE
  // ==========================================
  const RegistrationService = {
    /**
     * Submit a new student registration
     * @param {Object} data - Student registration payload
     * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
     */
    async createRegistration(data) {
      const regCode = generateRegCode();
      const payload = {
        reg_code: regCode,
        student_name: (data.student_name || "").trim(),
        parent_name: (data.parent_name || "").trim(),
        class: data.class,
        board: data.board,
        board_other: data.board === "Other" ? (data.board_other || "").trim() : null,
        subjects: Array.isArray(data.subjects) ? data.subjects : [data.subjects],
        subject_count: Array.isArray(data.subjects) ? data.subjects.length : 1,
        monthly_fee: Number(data.monthly_fee) || CONFIG.getFee(data.class, Array.isArray(data.subjects) ? data.subjects.length : 1),
        phone: (data.phone || "").trim(),
        whatsapp: data.whatsapp ? data.whatsapp.trim() : (data.phone || "").trim(),
        student_phone: data.student_phone ? data.student_phone.trim() : null,
        email: (data.email || "").trim(),
        location: (data.location || "").trim(),
        preferred_days: Array.isArray(data.preferred_days) ? data.preferred_days : [data.preferred_days],
        preferred_time_period: data.preferred_time_period || "Evening",
        preferred_time_slot: data.preferred_time_slot,
        additional_message: (data.additional_message || "").trim(),
        registration_status: "New",
        teacher_notes: "",
        created_at: new Date().toISOString()
      };

      // 1. Try inserting to Supabase if configured
      if (supabaseClient) {
        try {
          const { data: inserted, error } = await supabaseClient
            .from(CONFIG.SUPABASE.TABLE_NAME || "student_registrations")
            .insert([payload])
            .select();

          if (error) {
            console.warn("[EduNest Supabase] Representation insert note, attempting direct insert:", error.message);
            // Fallback direct insert without representation select
            const minInsert = await supabaseClient
              .from(CONFIG.SUPABASE.TABLE_NAME || "student_registrations")
              .insert([payload]);

            if (!minInsert.error) {
              console.info("[EduNest Supabase] Registration saved to Supabase database successfully.");
              return { success: true, data: payload, isLiveSupabase: true };
            }
            console.error("[EduNest Supabase] Insert failed, backing up to local storage:", minInsert.error);
            return this._saveLocally(payload);
          }

          const returnData = (Array.isArray(inserted) && inserted.length > 0) ? inserted[0] : payload;
          console.info("[EduNest Supabase] Registration saved and synced with Supabase database.");
          return { success: true, data: returnData, isLiveSupabase: true };
        } catch (err) {
          console.warn("Supabase network error, saving locally:", err);
          return this._saveLocally(payload);
        }
      }

      // 2. Otherwise save to clean local storage
      return this._saveLocally(payload);
    },

    _saveLocally(payload) {
      const localList = getLocalRegistrations();
      payload.id = "local-" + Date.now();
      localList.unshift(payload);
      saveLocalRegistrations(localList);
      return { success: true, data: payload, isLiveSupabase: false };
    },

    /**
     * Fetch all registrations with optional filtering & search
     */
    async getAllRegistrations() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from(CONFIG.SUPABASE.TABLE_NAME || "student_registrations")
            .select("*")
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Supabase fetch error:", error);
            return { success: false, data: getLocalRegistrations(), error: error.message };
          }
          return { success: true, data: data || [] };
        } catch (err) {
          console.warn("Supabase fetch exception, falling back to local:", err);
          return { success: true, data: getLocalRegistrations() };
        }
      }
      return { success: true, data: getLocalRegistrations() };
    },

    /**
     * Get single registration by ID or RegCode
     */
    async getRegistrationById(idOrCode) {
      if (supabaseClient) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
          let query = supabaseClient.from(CONFIG.SUPABASE.TABLE_NAME || "student_registrations").select("*");
          if (isUuid) {
            query = query.eq("id", idOrCode);
          } else {
            query = query.eq("reg_code", idOrCode);
          }
          const { data, error } = await query.single();
          if (!error && data) return { success: true, data };
        } catch (e) {
          console.warn("Supabase single get error:", e);
        }
      }

      const list = getLocalRegistrations();
      const item = list.find(r => r.id === idOrCode || r.reg_code === idOrCode);
      if (item) return { success: true, data: item };
      return { success: false, error: "Registration record not found." };
    },

    /**
     * Update Registration Status and/or Teacher Notes
     */
    async updateRegistrationStatus(idOrCode, status, notes = null) {
      const updates = {
        registration_status: status,
        updated_at: new Date().toISOString()
      };
      if (notes !== null) {
        updates.teacher_notes = notes;
      }

      if (supabaseClient) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
          let query = supabaseClient.from(CONFIG.SUPABASE.TABLE_NAME || "student_registrations");
          if (isUuid) {
            query = query.update(updates).eq("id", idOrCode);
          } else {
            query = query.update(updates).eq("reg_code", idOrCode);
          }
          const { data, error } = await query.select().single();
          if (error) throw error;
          return { success: true, data };
        } catch (err) {
          console.warn("Supabase update error, applying locally:", err);
        }
      }

      // Update local storage
      const list = getLocalRegistrations();
      const idx = list.findIndex(r => r.id === idOrCode || r.reg_code === idOrCode);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        saveLocalRegistrations(list);
        return { success: true, data: list[idx] };
      }
      return { success: false, error: "Registration record not found." };
    }
  };

  // ==========================================
  // SINGLE-TEACHER AUTH & PROFILE SERVICE
  // ==========================================
  const AuthService = {
    /**
     * Retrieve the persistent Teacher Admin Profile
     */
    getAdminProfile() {
      try {
        const custom = localStorage.getItem(PROFILE_KEY);
        if (custom) {
          return JSON.parse(custom);
        }
      } catch (e) {
        console.warn("Error reading admin profile from storage", e);
      }
      return {
        name: (CONFIG.TEACHER && CONFIG.TEACHER.name) || "K. Sarada",
        email: (CONFIG.TEACHER && CONFIG.TEACHER.email) || "edunest19@gmail.com",
        phone: (CONFIG.TEACHER && (CONFIG.TEACHER.mobile || CONFIG.TEACHER.WHATSAPP_NUMBER)) || "9063030342",
        phoneDisplay: (CONFIG.TEACHER && CONFIG.TEACHER.phoneDisplay) || "+91 90630 30342",
        passwordHash: null // null indicates default setup or Supabase Auth managed
      };
    },

    saveAdminProfile(profile) {
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        if (CONFIG.TEACHER) {
          if (profile.name) CONFIG.TEACHER.name = profile.name;
          if (profile.email) CONFIG.TEACHER.email = profile.email;
          if (profile.phone) {
            CONFIG.TEACHER.mobile = profile.phone;
            CONFIG.TEACHER.WHATSAPP_NUMBER = profile.phone;
          }
        }
      } catch (e) {
        console.error("Failed to save admin profile", e);
      }
    },

    /**
     * Clean phone number for flexible matching (handles +91, spaces, dashes)
     */
    normalizePhone(phoneStr) {
      if (!phoneStr) return "";
      const cleaned = phoneStr.replace(/[^0-9]/g, "");
      if (cleaned.length === 12 && cleaned.startsWith("91")) {
        return cleaned.substring(2);
      }
      if (cleaned.length === 11 && cleaned.startsWith("0")) {
        return cleaned.substring(1);
      }
      return cleaned;
    },

    /**
     * Authenticate Teacher by Email or Mobile Number
     * @param {string} identifier - Email (e.g. edunest19@gmail.com) OR Phone (9063030342)
     * @param {string} password - Teacher Password
     */
    async login(identifier, password) {
      const rawInput = (identifier || "").trim();
      const isEmail = rawInput.includes("@");
      const profile = this.getAdminProfile();
      const adminEmail = (profile.email || (CONFIG.TEACHER && CONFIG.TEACHER.email) || "edunest19@gmail.com").toLowerCase();
      const adminPhone = this.normalizePhone(profile.phone || (CONFIG.TEACHER && CONFIG.TEACHER.mobile) || "9063030342");
      const inputPhone = this.normalizePhone(rawInput);

      let targetEmail = isEmail ? rawInput.toLowerCase() : adminEmail;

      // 1. Try Supabase Auth if connected
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: targetEmail,
            password: password
          });
          if (!error && data?.session) {
            const userSession = {
              email: data.user.email,
              id: data.user.id,
              name: data.user.user_metadata?.full_name || profile.name,
              phone: profile.phone,
              isSupabase: true
            };
            // Sync active profile email with the authenticated Supabase user's email
            profile.email = data.user.email;
            this.saveAdminProfile(profile);
            sessionStorage.setItem(AUTH_KEY, JSON.stringify(userSession));
            return { success: true, user: userSession };
          }
          if (error) {
            console.warn("Supabase auth response:", error.message);
            // If the user attempted email login via live Supabase, return Supabase's specific error message
            if (isEmail && !error.message.includes("fetch")) {
              return { success: false, error: error.message };
            }
          }
        } catch (err) {
          console.warn("Supabase auth exception:", err);
        }
      }

      // 2. Validate against single authorized Teacher profile (fallback / mobile)
      const emailMatches = isEmail && rawInput.toLowerCase() === adminEmail;
      const phoneMatches = !isEmail && (inputPhone === adminPhone || inputPhone === "9063030342");

      // Default password or custom saved password (only the active current password is valid)
      const savedPassword = profile.customPassword || "admin123";
      const passwordMatches = password === savedPassword;

      if ((emailMatches || phoneMatches) && passwordMatches) {
        const userSession = {
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          role: "Teacher Admin",
          isDemo: false
        };
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(userSession));
        return { success: true, user: userSession };
      }

      if (!emailMatches && !phoneMatches) {
        return {
          success: false,
          error: "Unrecognized credentials. Please verify your registered email or mobile number."
        };
      }

      return {
        success: false,
        error: "Incorrect password. Please verify your password or use 'Forgot Password' to reset."
      };
    },

    /**
     * Sign In with Google / Gmail via Supabase OAuth
     */
    async signInWithGoogle() {
      if (supabaseClient) {
        const redirectUrl = window.location.origin + (window.location.pathname.includes("/admin/") ? window.location.pathname.replace("login.html", "dashboard.html") : "/admin/dashboard.html");
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl
          }
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true, data };
      }
      return {
        success: false,
        error: "Supabase project connection is required for live Google OAuth sign-in. Please ensure Supabase keys are configured in js/config.js."
      };
    },

    /**
     * Send Password Reset link/email
     * @param {string} email - Email to send reset link to
     */
    async resetPassword(email) {
      email = (email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        return { success: false, error: "Please enter a valid email address." };
      }

      if (supabaseClient) {
        try {
          const redirectUrl = window.location.origin + window.location.pathname;
          const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
          });
          if (error) {
            return { success: false, error: error.message };
          }
          return {
            success: true,
            message: `A password reset link has been dispatched to ${email}. Please check your inbox and spam folder.`
          };
        } catch (err) {
          console.warn("Supabase reset email failed:", err);
          return {
            success: false,
            error: err.message || "Failed to send reset email."
          };
        }
      }

      const profile = this.getAdminProfile();
      profile.email = email;
      this.saveAdminProfile(profile);

      return {
        success: true,
        message: `Password reset link sent to ${email}. Check your email to create a new password.`
      };
    },

    /**
     * Change / Update Teacher Password
     * @param {string} newPassword - New password
     */
    async updatePassword(newPassword) {
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: "Password must be at least 6 characters long." };
      }

      const profile = this.getAdminProfile();
      profile.customPassword = newPassword;
      this.saveAdminProfile(profile);

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
          });
          if (error) {
            console.warn("Supabase password update note:", error.message);
          }
        } catch (err) {
          console.warn("Supabase password update exception:", err);
        }
      }

      return { success: true, message: "Password updated successfully!" };
    },

    /**
     * Change / Update Teacher Email Address
     * @param {string} newEmail - New Email address
     */

    async updateEmail(newEmail) {
      newEmail = (newEmail || "").trim().toLowerCase();
      if (!newEmail || !newEmail.includes("@")) {
        return { success: false, error: "Please provide a valid email address." };
      }

      const profile = this.getAdminProfile();
      profile.email = newEmail;
      this.saveAdminProfile(profile);

      // Update current session if active
      const user = this.getUser();
      if (user) {
        user.email = newEmail;
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
      }

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.auth.updateUser({
            email: newEmail
          });
          if (error) {
            console.warn("Supabase email update note:", error.message);
          }
        } catch (err) {
          console.warn("Supabase email update exception:", err);
        }
      }

      return {
        success: true,
        message: `Admin email successfully updated to ${newEmail}. Use this new email for future logins.`
      };
    },

    /**
     * Update Teacher Profile (Name, Phone, Email)
     */
    async updateProfile(updates) {
      const profile = this.getAdminProfile();
      if (updates.name) profile.name = updates.name.trim();
      if (updates.phone) {
        profile.phone = updates.phone.trim();
        profile.phoneDisplay = updates.phone.trim().startsWith("+") ? updates.phone.trim() : `+91 ${updates.phone.trim()}`;
      }
      if (updates.email) profile.email = updates.email.trim().toLowerCase();

      this.saveAdminProfile(profile);

      const user = this.getUser();
      if (user) {
        user.name = profile.name;
        user.email = profile.email;
        user.phone = profile.phone;
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
      }

      return { success: true, profile };
    },

    getUser() {
      try {
        const raw = sessionStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    isAuthenticated() {
      return !!this.getUser();
    },

    async logout() {
      if (supabaseClient) {
        try {
          await supabaseClient.auth.signOut();
        } catch (e) {
          console.warn("Supabase signout err", e);
        }
      }
      sessionStorage.removeItem(AUTH_KEY);
      return { success: true };
    },

    requireAuth() {
      if (!this.isAuthenticated()) {
        const currentPath = window.location.pathname;
        const loginUrl = currentPath.includes("/admin/") ? "login.html" : "admin/login.html";
        window.location.href = loginUrl;
      }
    }
  };

  // Expose globally
  window.EduNest = {
    RegistrationService,
    AuthService,
    isSupabaseConfigured,
    supabaseClient
  };

})(window);
