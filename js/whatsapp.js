/**
 * WhatsApp Message Generator & URL Formatter
 * Prepares formatted registration text to send from Student/Parent to Teacher
 */

(function (window) {
  "use strict";

  const WhatsAppUtil = {
    /**
     * Formats registration record into clean WhatsApp text
     * @param {Object} reg - Student registration object
     * @returns {string} Plain text formatted message
     */
    formatRegistrationMessage(reg) {
      const boardDisplay = reg.board || "CBSE";

      const subjectsDisplay = Array.isArray(reg.subjects)
        ? reg.subjects.join(", ")
        : reg.subjects;

      const daysDisplay = Array.isArray(reg.preferred_days)
        ? reg.preferred_days.join(", ")
        : reg.preferred_days;

      const feeFormatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(reg.monthly_fee || 0);

      const studentMobileLine = reg.student_phone 
        ? `\n*Student Mobile:* ${reg.student_phone}` 
        : '';

      return (
        `*New Home Tuition Registration*

*Student Name:* ${reg.student_name}
*Class:* ${reg.class}
*Board:* ${boardDisplay}
*Subjects:* ${subjectsDisplay} (${reg.subject_count || (Array.isArray(reg.subjects) ? reg.subjects.length : 1)} Subject${(reg.subject_count > 1 || (Array.isArray(reg.subjects) && reg.subjects.length > 1)) ? 's' : ''})
*Monthly Fee:* ${feeFormatted}

*Parent / Guardian:* ${reg.parent_name}
*Parent Primary Phone:* ${reg.phone}
*Parent WhatsApp:* ${reg.whatsapp || reg.phone}${studentMobileLine}
*Email:* ${reg.email || "Not Provided"}
*Residential Location:* ${reg.location}

*Preferred Days:* ${daysDisplay}
*Preferred Time Slot:* ${reg.preferred_time_slot}${reg.preferred_time_period ? ` (${reg.preferred_time_period})` : ''}

*Academic Focus / Requirements:* ${reg.additional_message || "None"}

*Registration ID:* ${reg.reg_code || reg.id}`
      );
    },

    /**
     * Generates the direct WhatsApp Click-to-Chat URL
     * @param {Object} reg - Student registration object
     * @returns {string} WhatsApp URL
     */
    generateWhatsAppUrl(reg) {
      const teacherNumber = (CONFIG && CONFIG.TEACHER && CONFIG.TEACHER.WHATSAPP_NUMBER) || "919063030342";
      const cleanNumber = teacherNumber.replace(/[^0-9]/g, "");
      const message = this.formatRegistrationMessage(reg);
      const encodedMessage = encodeURIComponent(message);
      return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    },

    /**
     * Direct link to message a student/parent (for teacher admin use)
     */
    generateStudentDirectWhatsAppUrl(studentPhone, studentName, regCode) {
      const cleanNumber = (studentPhone || "").replace(/[^0-9]/g, "");
      const fullPhone = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
      const text = encodeURIComponent(
        `Hello ${studentName}! This is ${CONFIG.TEACHER.name} regarding your Home Tuition registration (${regCode}). I would like to discuss your slot timings and start dates.`
      );
      return `https://wa.me/${fullPhone}?text=${text}`;
    },

    /**
     * Open WhatsApp directly in new window/tab or app
     */
    openWhatsApp(reg) {
      const url = this.generateWhatsAppUrl(reg);
      window.open(url, "_blank");
    }
  };

  window.WhatsAppUtil = WhatsAppUtil;
})(window);
