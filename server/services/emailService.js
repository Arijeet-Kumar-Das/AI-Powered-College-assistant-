// services/emailService.js
// Email service with Resend (HTTP API) for production and Gmail SMTP for local dev

const nodemailer = require("nodemailer");
const axios = require("axios");

// ==================== EMAIL PROVIDERS ====================

/**
 * Send email via Resend HTTP API (works on all cloud platforms including Render)
 * No SMTP needed — uses HTTPS POST instead
 */
const sendViaResend = async ({ from, to, replyTo, subject, html }) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return null; // Signal to fall back to SMTP

    try {
        const response = await axios.post(
            "https://api.resend.com/emails",
            {
                from: from || "BMS College Assistant <onboarding@resend.dev>",
                to: Array.isArray(to) ? to : [to],
                reply_to: replyTo,
                subject,
                html,
            },
            {
                headers: {
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 15000, // 15s timeout
            }
        );

        return {
            success: true,
            messageId: response.data.id,
            provider: "resend",
        };
    } catch (error) {
        console.error("Resend API error:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            provider: "resend",
        };
    }
};

/**
 * Send email via Gmail SMTP (works locally, may fail on cloud platforms)
 */
const sendViaGmail = async ({ from, to, replyTo, subject, html }) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
    });

    try {
        const emailTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gmail SMTP timed out after 20 seconds")), 20000)
        );

        const sendPromise = transporter.sendMail({
            from: from || `"BMS College Assistant" <${process.env.EMAIL_USER}>`,
            to,
            replyTo,
            subject,
            html,
        });

        const info = await Promise.race([sendPromise, emailTimeout]);

        return {
            success: true,
            messageId: info.messageId,
            provider: "gmail",
        };
    } catch (error) {
        console.error("Gmail SMTP error:", error.message);
        return {
            success: false,
            error: error.message,
            provider: "gmail",
        };
    }
};

/**
 * Send email using the best available provider
 * Priority: Resend (HTTP API) → Gmail SMTP → Error
 */
const sendEmail = async ({ from, to, replyTo, subject, html }) => {
    // Try Resend first (works on cloud platforms)
    const resendResult = await sendViaResend({ from, to, replyTo, subject, html });
    if (resendResult) {
        if (resendResult.success) {
            console.log(`Email sent via Resend: ${resendResult.messageId}`);
            return resendResult;
        }
        console.log(`Resend failed: ${resendResult.error}, trying Gmail SMTP...`);
    }

    // Fall back to Gmail SMTP (works locally)
    const gmailResult = await sendViaGmail({ from, to, replyTo, subject, html });
    if (gmailResult) {
        if (gmailResult.success) {
            console.log(`Email sent via Gmail: ${gmailResult.messageId}`);
            return gmailResult;
        }
        return {
            success: false,
            error: "send_failed",
            message: gmailResult.error,
        };
    }

    return {
        success: false,
        error: "email_not_configured",
        message: "No email service configured. Set RESEND_API_KEY or EMAIL_USER/EMAIL_PASS in .env",
    };
};

// ==================== LEAVE & PROFESSIONAL EMAILS ====================

/**
 * Build the leave application HTML email body
 */
const buildLeaveHtml = (senderInfo, leaveDetails) => {
    const { name, email, role, department, id } = senderInfo;
    const { reason, fromDate, toDate, leaveType } = leaveDetails;
    const recipientName = leaveDetails.recipientName || "Admin";

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
        Leave Application
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
};

/**
 * Send a leave application email
 */
const sendLeaveEmail = async (senderInfo, leaveDetails) => {
    const { name, email, role } = senderInfo;
    const toEmail = leaveDetails.toEmail || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    const html = buildLeaveHtml(senderInfo, leaveDetails);

    const result = await sendEmail({
        from: process.env.RESEND_API_KEY
            ? "BMS College Assistant <onboarding@resend.dev>"
            : `"BMS College Assistant" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        replyTo: email,
        subject: `Leave Application - ${name} (${role.toUpperCase()})`,
        html,
    });

    if (result.success) {
        return {
            success: true,
            messageId: result.messageId,
            message: `Leave application sent successfully to ${toEmail}`,
        };
    }

    return {
        success: false,
        error: result.error || "send_failed",
        message: result.message || result.error || "Failed to send email",
    };
};

/**
 * Send a general professional email
 */
const sendProfessionalEmail = async (senderInfo, emailDetails) => {
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

    const result = await sendEmail({
        from: process.env.RESEND_API_KEY
            ? `${name} via BMS Assistant <onboarding@resend.dev>`
            : `"${name} via BMS Assistant" <${process.env.EMAIL_USER}>`,
        to: recipient,
        replyTo: email,
        subject: subject || `Message from ${name}`,
        html: emailHtml,
    });

    if (result.success) {
        return {
            success: true,
            messageId: result.messageId,
            message: `Email sent successfully to ${recipient}`,
        };
    }

    return {
        success: false,
        error: result.error || "send_failed",
        message: result.message || result.error || "Failed to send email",
    };
};

// ==================== PARSING HELPERS ====================

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
