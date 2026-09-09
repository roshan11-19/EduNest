/**
 * Home Tuition Slot Booking & Registration System
 * Global Configuration File
 * 
 * Centralized settings for Teacher Contact, Fees, Academic Options, Time Slots,
 * and Supabase backend credentials.
 */

const CONFIG = {
  // ==========================================
  // 1. TEACHER & TUITION DETAILS
  // ==========================================
  TEACHER: {
    name: "K. Sarada",
    title: "Senior Home Tutor & Academic Mentor",
    qualification: "M.Sc(pure physics),M.Phil",
    experience: "16+ Years of Teaching Excellence",
    phoneDisplay: "+91 90630 30342",
    mobile: "9063030342",
    // Configurable Teacher WhatsApp Number (Country code + 10 digits, no spaces/dashes)
    WHATSAPP_NUMBER: "919063030342",
    email: "edunest19@gmail.com",
    city: "Visakhapatnam, Andhra Pradesh",
    residenceAddress: "PM Palem, Dharmapuram, Opp Living Space, Visakhapatnam, Andhra Pradesh",
    serviceAreas: [
      "PM Palem", "Madhurawada", "Dharmapuram", 
      "Kommadi", "Yendada", "MVP Colony", "Rushikonda"
    ]
  },

  // ==========================================
  // SINGLE ADMIN PROFILE CREDENTIALS
  // ==========================================
  ADMIN: {
    allowedEmail: "edunest19@gmail.com",
    allowedPhone: "9063030342",
    name: "K. Sarada"
  },

  // ==========================================
  // 2. TUITION FEE STRUCTURE (Monthly)
  // ==========================================
  FEES: {
    // Classes 8th, 9th, 10th
    foundation: {
      1: 999,   // 1 Subject: ₹999 / month
      2: 1999,  // 2 Subjects: ₹1,999 / month
      3: 2499   // 3 Subjects (PCM): ₹2,499 / month
    },
    // Classes 11th, 12th
    senior: {
      1: 1499,  // 1 Subject: ₹1,499 / month
      2: 2999,  // 2 Subjects: ₹2,999 / month
      3: 3999   // 3 Subjects (PCM): ₹3,999 / month
    }
  },

  // Helper method to compute fee based on class and count of subjects
  getFee(academicClass, count) {
    if (!count || count <= 0) return 0;
    const isSenior = academicClass && (academicClass.includes("11") || academicClass.includes("12"));
    const feeTier = isSenior ? this.FEES.senior : this.FEES.foundation;
    if (count === 1) return feeTier[1];
    if (count === 2) return feeTier[2];
    if (count >= 3) return feeTier[3];
    return 0;
  },

  // Helper method for subject count (backward-compatible fallback)
  getFeeForSubjectCount(count, academicClass = "10th Standard") {
    return this.getFee(academicClass, count);
  },

  // ==========================================
  // 3. ACADEMIC CLASSES
  // Only 8th to 12th standard (Single selection only)
  // ==========================================
  CLASSES: [
    { id: "8th", name: "8th Standard", badge: "Foundation Roots", desc: "Basics of 8th Class — Strong foundational clarity in Mathematics, Physics & Chemistry fundamentals." },
    { id: "9th", name: "9th Standard", badge: "Bridge Foundation", desc: "Basics of 9th Class — Strengthening core concepts, analytical problem solving & board bridge foundations." },
    { id: "10th", name: "10th Standard", badge: "Board Exam Mastery", desc: "Selected Board for 10th (CBSE / ICSE / State Board) — Complete syllabus coverage, past 10-year question banks & weekly timed mock tests." },
    { id: "11th", name: "11th Standard", badge: "Senior Secondary & Entrance", desc: "11th Board Syllabus + EAMCET & JEE Mains / Advanced Training — In-depth mechanics, calculus & organic fundamentals with shortcut techniques." },
    { id: "12th", name: "12th Standard", badge: "Final Board & Competitive Prep", desc: "12th Board Syllabus + EAMCET, JEE Mains & Advanced Training — Rigorous revision, speed-accuracy drills, mock series & high-rank prep." }
  ],

  // ==========================================
  // 4. EDUCATION BOARDS
  // ==========================================
  BOARDS: [
    { id: "CBSE", name: "CBSE (NCERT Curriculum)" },
    { id: "ICSE", name: "ICSE / ISC Board" },
    { id: "State Board", name: "State Board (Andhra Pradesh State Board)" }
  ],

  // ==========================================
  // 5. SUBJECTS OFFERED
  // ==========================================
  SUBJECTS: [
    {
      id: "Physics",
      name: "Physics",
      icon: "atom",
      color: "#35483A",
      summary: "Mechanics, Thermodynamics, Optics, Electricity & Magnetism with practical problem solving."
    },
    {
      id: "Chemistry",
      name: "Chemistry",
      icon: "flask",
      color: "#8A6A4A",
      summary: "Physical Chemistry equations, Inorganic reactions & Organic reaction mechanisms."
    },
    {
      id: "Mathematics",
      name: "Mathematics",
      icon: "calculator",
      color: "#C7A76C",
      summary: "Algebra, Trigonometry, Coordinate Geometry, Vectors & Calculus with speed shortcut methods."
    }
  ],

  // ==========================================
  // 6. DAYS OF THE WEEK
  // ==========================================
  DAYS: [
    { id: "Monday", label: "Mon", full: "Monday" },
    { id: "Tuesday", label: "Tue", full: "Tuesday" },
    { id: "Wednesday", label: "Wed", full: "Wednesday" },
    { id: "Thursday", label: "Thu", full: "Thursday" },
    { id: "Friday", label: "Fri", full: "Friday" },
    { id: "Saturday", label: "Sat", full: "Saturday" },
    { id: "Sunday", label: "Sun", full: "Sunday" }
  ],

  // ==========================================
  // 7. TIME SLOTS (Evening Batches Only)
  // Single Subject (1-Hr): 6:30-7:30, 7:00-8:00, 7:30-8:30, 8:00-9:00
  // 2+ Subjects (2-Hr): 6:30-8:30, 7:00-9:00
  // ==========================================
  TIME_SLOTS_SINGLE: [
    { id: "630-730pm", period: "Evening", slot: "6:30 PM – 7:30 PM", duration: "1 Hour", desc: "1-Hr Single Subject Batch" },
    { id: "7-8pm", period: "Evening", slot: "7:00 PM – 8:00 PM", duration: "1 Hour", desc: "1-Hr Single Subject Batch" },
    { id: "730-830pm", period: "Evening", slot: "7:30 PM – 8:30 PM", duration: "1 Hour", desc: "1-Hr Single Subject Batch" },
    { id: "8-9pm", period: "Evening", slot: "8:00 PM – 9:00 PM", duration: "1 Hour", desc: "1-Hr Single Subject Batch" }
  ],

  TIME_SLOTS_MULTI: [
    { id: "630-830pm", period: "Evening", slot: "6:30 PM – 8:30 PM", duration: "2 Hours", desc: "2-Hr Multi-Subject Batch" },
    { id: "7-9pm", period: "Evening", slot: "7:00 PM – 9:00 PM", duration: "2 Hours", desc: "2-Hr Multi-Subject Batch" }
  ],

  // Fallback combined list
  TIME_SLOTS: [
    { id: "630-730pm", period: "Evening", slot: "6:30 PM – 7:30 PM" },
    { id: "7-8pm", period: "Evening", slot: "7:00 PM – 8:00 PM" },
    { id: "730-830pm", period: "Evening", slot: "7:30 PM – 8:30 PM" },
    { id: "8-9pm", period: "Evening", slot: "8:00 PM – 9:00 PM" },
    { id: "630-830pm", period: "Evening", slot: "6:30 PM – 8:30 PM" },
    { id: "7-9pm", period: "Evening", slot: "7:00 PM – 9:00 PM" }
  ],

  getTimeSlots(subjectCount = 1) {
    return (subjectCount >= 2) ? this.TIME_SLOTS_MULTI : this.TIME_SLOTS_SINGLE;
  },

  SUPABASE: {
    // Live Project URL
    URL: "https://rwcwdkafhvnemqamappf.supabase.co",
    // Public Anon Key
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Y3dka2FmaHZuZW1xYW1hcHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTQwNDgsImV4cCI6MjEwNDI5MDA0OH0.z0HSjKvBk_b1dnilZ7dDrUbtomf3NHui4H7rlBphmHk",
    // Table name for student registrations
    TABLE_NAME: "student_registrations"
  }
};

// Freeze configuration to prevent accidental runtime mutations
if (typeof Object.freeze === "function") {
  if (CONFIG.FEES.foundation) Object.freeze(CONFIG.FEES.foundation);
  if (CONFIG.FEES.senior) Object.freeze(CONFIG.FEES.senior);
  Object.freeze(CONFIG.FEES);
}
