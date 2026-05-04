// services/emailService.js
// Email service using Nodemailer for leave applications and professional emails

const nodemailer = require("nodemailer");

// Create transporter (configure with your SMTP settings)
const createTransporter = () => {
    // Check for Gmail configuration
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, // Use App Password for Gmail
            },
            // Timeouts to prevent indefinite hanging on cloud platforms (Render, etc.)
            connectionTimeout: 15000, // 15 seconds to establish connection
            greetingTimeout: 15000,   // 15 seconds for SMTP greeting
            socketTimeout: 15000,     // 15 seconds for socket inactivity
        });
    }

    // Fallback: Ethereal (for testing - emails won't actually be sent)
    console.log("No email credentials configured. Using test mode.");
    return null;
};

/**
 * Send a leave application email
 */
const sendLeaveEmail = async (senderInfo, leaveDetails) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            success: false,
            error: "email_not_configured",
            message: "Email service is not configured. Please ask admin to set up EMAIL_USER and EMAIL_PASS in .env",
        };
    }

    const { name, email, role, department, id } = senderInfo;
    const { reason, fromDate, toDate, leaveType } = leaveDetails;

    // Use provided toEmail or fall back to admin email
    const toEmail = leaveDetails.toEmail || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const recipientName = leaveDetails.recipientName || "Admin";

    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
        📋 Leave Application
      </h2>
      
      <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4caf50;">
        <p style="margin: 0; font-size: 14px;"><strong>From:</strong> ${name} (${role.charAt(0).toUpperCase() + role.slice(1)})</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>To:</strong> ${recipientName}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Applicant Details</h3>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 5px 0;"><strong>${role === "student" ? "USN" : "Employee ID"}:</strong> ${id}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Department:</strong> ${department}</p>
        <p style="margin: 5px 0;"><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
      </div>
      
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
        <h3 style="margin: 0 0 10px 0; color: #856404;">Leave Details</h3>
        <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveType || "Personal Leave"}</p>
        <p style="margin: 5px 0;"><strong>From:</strong> ${fromDate || "Not specified"}</p>
        <p style="margin: 5px 0;"><strong>To:</strong> ${toDate || "Not specified"}</p>
        <p style="margin: 5px 0;"><strong>Reason:</strong></p>
        <p style="margin: 5px 0; padding: 10px; background: white; border-radius: 5px;">${reason}</p>
      </div>
      
      <p style="color: #666; font-size: 12px; margin-top: 20px; text-align: center;">
        This email was sent via BMS College AI Assistant
      </p>
    </div>
  `;

    try {
        // Race between sending email and a 20s timeout to prevent indefinite hanging
        const emailTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Email sending timed out after 20 seconds. Gmail SMTP may be blocked on this server.")), 20000)
        );

        const sendPromise = transporter.sendMail({
            from: `"BMS College Assistant" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            replyTo: email,
            subject: `Leave Application - ${name} (${role.toUpperCase()})`,
            html: emailHtml,
        });

        const info = await Promise.race([sendPromise, emailTimeout]);

        console.log("Leave email sent:", info.messageId);

        return {
            success: true,
            messageId: info.messageId,
            message: `Leave application sent successfully to ${toEmail}`,
        };
    } catch (error) {
        console.error("Email error:", error.message);
        return {
            success: false,
            error: "send_failed",
            message: error.message.includes("timed out")
                ? "Email service timed out. The server may be blocking SMTP connections. Please try again later or contact the recipient directly."
                : error.message,
        };
    }
};

/**
 * Send a general professional email
 */
const sendProfessionalEmail = async (senderInfo, emailDetails) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            success: false,
            error: "email_not_configured",
            message: "Email service is not configured.",
        };
    }

    const { name, email, role, department, id } = senderInfo;
    const { subject, body, toEmail } = emailDetails;

    const recipient = toEmail || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p>${body.replace(/\n/g, "<br>")}</p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      
      <div style="font-size: 12px; color: #666;">
        <p><strong>From:</strong> ${name}</p>
        <p><strong>${role === "student" ? "USN" : "Employee ID"}:</strong> ${id}</p>
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Contact:</strong> ${email}</p>
      </div>
    </div>
  `;

    try {
        const emailTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Email sending timed out after 20 seconds.")), 20000)
        );

        const sendPromise = transporter.sendMail({
            from: `"${name} via BMS Assistant" <${process.env.EMAIL_USER}>`,
            to: recipient,
            replyTo: email,
            subject: subject || `Message from ${name}`,
            html: emailHtml,
        });

        const info = await Promise.race([sendPromise, emailTimeout]);

        console.log("Professional email sent:", info.messageId);

        return {
            success: true,
            messageId: info.messageId,
            message: `Email sent successfully to ${recipient}`,
        };
    } catch (error) {
        console.error("Email error:", error.message);
        return {
            success: false,
            error: "send_failed",
            message: error.message.includes("timed out")
                ? "Email service timed out. Please try again later."
                : error.message,
        };
    }
};

/**
 * Parse leave request from message
 */
const parseLeaveRequest = (message) => {
    const lowerMsg = message.toLowerCase();

    // Extract dates (various formats including ordinals like 15th Jan)
    const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
        // Match ordinal dates like "15th Jan", "1st January", "2nd Feb 2025"
        /(\d{1,2}(?:st|nd|rd|th)?\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{2,4})?)/gi,
        // Match "Jan 15", "January 15th"
        /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{2,4})?)/gi,
        /(today|tomorrow|next\s+\w+)/gi,
    ];

    let dates = [];
    for (const pattern of datePatterns) {
        const matches = message.match(pattern);
        if (matches) dates.push(...matches);
    }

    // Also try to extract "from X to Y" pattern
    const fromToMatch = message.match(/from\s+(.+?)\s+to\s+(.+?)(?:\s+(?:due|because|for|as)|$)/i);
    if (fromToMatch && dates.length === 0) {
        dates = [fromToMatch[1].trim(), fromToMatch[2].trim()];
    }

    // Determine leave type
    let leaveType = "Personal Leave";
    if (lowerMsg.includes("sick") || lowerMsg.includes("medical") || lowerMsg.includes("health")) {
        leaveType = "Medical Leave";
    } else if (lowerMsg.includes("emergency") || lowerMsg.includes("urgent")) {
        leaveType = "Emergency Leave";
    } else if (lowerMsg.includes("casual")) {
        leaveType = "Casual Leave";
    } else if (lowerMsg.includes("vacation") || lowerMsg.includes("holiday")) {
        leaveType = "Vacation Leave";
    }

    // Extract reason (everything after "because", "for", "due to", etc.)
    let reason = message;
    const reasonPatterns = [
        /(?:because|for|due to|as|since)\s+(.+)/i,
        /leave[,.\s]+(.+)/i,
    ];

    for (const pattern of reasonPatterns) {
        const match = message.match(pattern);
        if (match) {
            reason = match[1].trim();
            break;
        }
    }

    // Parse recipient - detect if sending to admin or specific teacher
    const recipientInfo = parseRecipient(message);

    return {
        leaveType,
        fromDate: dates[0] || null,
        toDate: dates[1] || dates[0] || null,
        reason: reason,
        rawMessage: message,
        recipientInfo,
    };
};

/**
 * Parse recipient from message (admin or specific teacher)
 */
const parseRecipient = (message) => {
    const lowerMsg = message.toLowerCase();

    // Common words that should NOT be matched as teacher names
    const excludeWords = [
        "apply", "leave", "sick", "casual", "medical", "emergency", "vacation",
        "want", "need", "request", "send", "email", "for", "from", "to", "due",
        "fever", "cold", "appointment", "work", "personal", "family", "urgent",
        "today", "tomorrow", "days", "day", "week", "month", "class", "college"
    ];

    // Check if sending to admin explicitly
    if (
        lowerMsg.includes("to admin") ||
        lowerMsg.includes("send to admin") ||
        lowerMsg.includes("email admin") ||
        lowerMsg.includes("to the admin") ||
        lowerMsg.includes("hod") ||
        lowerMsg.includes("principal")
    ) {
        return { type: "admin", name: "Admin", searchTerm: null };
    }

    // Check for teacher patterns: "to prof X", "to teacher X", "to sir/ma'am X", "to X sir"
    const teacherPatterns = [
        /(?:to|email|send to)\s+(?:prof(?:essor)?\.?|dr\.?|teacher|sir|ma'?am|madam)\s+([a-z]+(?:\s+[a-z]+)?)/i,
        /(?:to|email|send to)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:sir|ma'?am|madam|teacher|prof)/i,
    ];

    for (const pattern of teacherPatterns) {
        const match = message.match(pattern);
        if (match) {
            const name = match[1].trim().toLowerCase();
            // Validate it's not a common word
            if (!excludeWords.includes(name) && name.length > 2) {
                return { type: "teacher", name: match[1].trim(), searchTerm: name };
            }
        }
    }

    // Check for subject code patterns to find subject teacher
    const subjectMatch = message.match(/\b([a-z]{2,4}\d{2,4})\b/i);
    if (subjectMatch) {
        return { type: "subject", subjectCode: subjectMatch[1].toUpperCase(), searchTerm: subjectMatch[1] };
    }

    // Default: not specified (will prompt user to choose)
    return { type: "unspecified", name: null, searchTerm: null };
};

/**
 * Find teacher email by name or subject code
 */
const findTeacherEmail = async (recipientInfo, Teacher, Subject) => {
    try {
        if (recipientInfo.type === "admin") {
            return {
                email: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
                name: "Admin",
                found: true,
            };
        }

        if (recipientInfo.type === "teacher" && recipientInfo.searchTerm) {
            // Search by name (case-insensitive partial match)
            const teacher = await Teacher.findOne({
                name: { $regex: recipientInfo.searchTerm, $options: "i" }
            });

            if (teacher) {
                return {
                    email: teacher.email,
                    name: teacher.name,
                    employeeId: teacher.employeeId,
                    found: true,
                };
            }
        }

        if (recipientInfo.type === "subject" && recipientInfo.subjectCode) {
            // Find teacher assigned to this subject
            const teacher = await Teacher.findOne({
                "subjectsAssigned.subjectCode": recipientInfo.subjectCode
            });

            if (teacher) {
                return {
                    email: teacher.email,
                    name: teacher.name,
                    employeeId: teacher.employeeId,
                    subjectCode: recipientInfo.subjectCode,
                    found: true,
                };
            }
        }

        return { found: false, searchTerm: recipientInfo.searchTerm || recipientInfo.subjectCode };
    } catch (error) {
        console.error("Error finding teacher:", error);
        return { found: false, error: error.message };
    }
};

/**
 * Get list of available teachers for selection
 */
const getAvailableTeachers = async (Teacher, department = null) => {
    try {
        const query = department ? { department } : {};
        const teachers = await Teacher.find(query).select("name email employeeId department subjectsAssigned");
        return teachers.map(t => ({
            name: t.name,
            email: t.email,
            employeeId: t.employeeId,
            department: t.department,
            subjects: t.subjectsAssigned?.map(s => s.subjectCode).join(", ") || "",
        }));
    } catch (error) {
        return [];
    }
};

module.exports = {
    sendLeaveEmail,
    sendProfessionalEmail,
    parseLeaveRequest,
    parseRecipient,
    findTeacherEmail,
    getAvailableTeachers,
};

