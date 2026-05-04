// controllers/chatController.js
// Chat controller with LLM integration for general queries

const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const { generateLLMResponse, saveChatHistory, classifyIntentWithLLM } = require("../services/llmService");
const { sendLeaveEmail, parseLeaveRequest, findTeacherEmail, getAvailableTeachers } = require("../services/emailService");
const { getStudentAttendanceSummary, MINIMUM_ATTENDANCE_PERCENT } = require("../utils/attendanceUtils");


// ==================== TEACHER CHAT ====================

exports.teacherChat = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teacherId = decoded.id;

    const { message } = req.body;
    console.log(`🧑‍🏫 ${decoded.employeeId}: "${message}"`);

    // Get teacher's data with subjects
    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) {
      return res.status(404).json({
        success: false,
        response: "Teacher profile not found. Please contact admin.",
      });
    }

    // ===== LLM-FIRST INTENT CLASSIFICATION =====
    const classification = await classifyIntentWithLLM(message, "teacher");
    console.log(`📊 LLM-First classification result:`, JSON.stringify(classification));

    let response;
    let isLLMResponse = false;
    let intent;

    if (classification.fallbackToNLP) {
      // LLM classification API failed — default to GENERAL (let LLM try to respond)
      console.log(`⚠️ LLM classification failed, defaulting to GENERAL`);
      intent = "GENERAL";
    } else if (classification.shouldUseLLM) {
      // LLM says this is a general query — let LLM respond
      intent = "GENERAL";
    } else {
      // LLM identified a specific DB intent
      intent = classification.nlpIntent;
    }

    // Route based on intent
    if (intent === "GENERAL") {
      // Use LLM for general queries
      const llmResult = await generateLLMResponse(
        message,
        "teacher",
        teacher,
        teacherId,
        "Teacher"
      );
      response = llmResult.response;
      isLLMResponse = llmResult.isLLM;
    } else if (intent === "LEAVE_APPLICATION") {
      // Handle leave application with email
      const leaveDetails = parseLeaveRequest(message);

      const senderInfo = {
        name: teacher.name,
        email: teacher.email,
        role: "teacher",
        department: teacher.department,
        id: teacher.employeeId,
      };

      const emailResult = await sendLeaveEmail(senderInfo, leaveDetails);

      if (emailResult.success) {
        response = `✅ **Leave Application Sent Successfully!**\n\n` +
          `📧 Your leave application has been emailed to the admin.\n\n` +
          `**Details Submitted:**\n` +
          `• **Leave Type:** ${leaveDetails.leaveType}\n` +
          `• **From:** ${leaveDetails.fromDate || "Not specified"}\n` +
          `• **To:** ${leaveDetails.toDate || "Not specified"}\n` +
          `• **Reason:** ${leaveDetails.reason.substring(0, 100)}${leaveDetails.reason.length > 100 ? "..." : ""}\n\n` +
          `You will receive a response on your registered email: **${teacher.email}**`;
      } else {
        response = `⚠️ **Leave Application Could Not Be Sent**\n\n` +
          `${emailResult.message}\n\n` +
          `Please try again later or contact admin directly.\n\n` +
          `💡 *Tip: Make sure your message includes the reason and dates, e.g., "I want to apply for sick leave from 15th Jan to 17th Jan due to medical appointment."*`;
      }
    } else {
      // Use rule-based response for database queries
      response = await generateTeacherResponse(intent, teacher);
    }

    // Save chat history to MongoDB
    await saveChatHistory(
      teacherId,
      "Teacher",
      message,
      response,
      intent,
      isLLMResponse
    );

    res.json({
      success: true,
      response,
      intent,
      isLLMResponse,
      teacher: {
        name: teacher.name,
        employeeId: teacher.employeeId,
        department: teacher.department,
        subjectsCount: teacher.subjectsAssigned?.length || 0,
      },
    });
  } catch (error) {
    console.error("💥 Teacher Chat Error:", error);
    res.status(500).json({
      success: false,
      response: "Sorry, something went wrong. Try again!",
    });
  }
};

// Teacher intent classification
const classifyTeacherIntent = (message) => {
  const m = message.toLowerCase().trim();

  // 1) Credits questions
  if (
    m.includes("credit") ||
    m.includes("how many credits") ||
    m.match(/\bcredits?\b/)
  ) {
    return "SUBJECT_CREDITS";
  }

  // 2) Semester questions
  if (m.includes("semester") || m.includes("which sem") || m.match(/\bsem\b/)) {
    return "SEMESTER_INFO";
  }

  // 3) Department questions
  if (
    m.includes("department") ||
    m.includes("dept") ||
    m.includes("which department")
  ) {
    return "DEPARTMENT";
  }

  // 4) Explicit "what subjects am I teaching/handling"
  if (
    m.includes("what subjects am i teaching") ||
    m.includes("which subjects am i teaching") ||
    m.includes("what subjects do i teach") ||
    m.includes("subjects i am handling") ||
    m.includes("my subjects") ||
    (m.includes("subjects") && (m.includes("am i") || m.includes("do i")))
  ) {
    return "MY_SUBJECTS";
  }

  // 5) Leave/Absence intent
  if (
    m.includes("leave") ||
    m.includes("apply for leave") ||
    m.includes("leave application") ||
    m.includes("sick leave") ||
    m.includes("absent") ||
    m.includes("can't come") ||
    m.includes("cannot come") ||
    m.includes("won't come") ||
    m.includes("not coming") ||
    m.includes("take off") ||
    m.includes("day off")
  ) {
    return "LEAVE_APPLICATION";
  }

  // 6) Fallback to LLM
  return "GENERAL";
};

// Teacher rule-based response generation
const generateTeacherResponse = async (intent, teacher) => {
  const subjects = teacher.subjectsAssigned || [];

  switch (intent) {
    case "MY_SUBJECTS":
      if (subjects.length === 0)
        return "You haven't been assigned any subjects yet. Contact your department admin to assign subjects.";

      const subjectList = subjects
        .map((s) => `• **${s.subjectCode}** - ${s.subjectName}`)
        .join("\n");
      return `You are currently teaching **${subjects.length} subject(s)**:\n\n${subjectList}`;

    case "SUBJECT_CREDITS":
      if (subjects.length === 0) return "No subjects assigned yet.";

      // Fetch actual credits from Subject collection
      const creditsInfo = await Promise.all(
        subjects.map(async (s) => {
          const fullSubject = await Subject.findOne({
            subjectCode: s.subjectCode,
          }).lean();
          return `**${s.subjectCode}**: ${fullSubject?.credits || "N/A"
            } credits`;
        })
      );
      return `📚 **Your Subjects Credits**:\n\n${creditsInfo.join("\n\n")}`;

    case "SEMESTER_INFO":
      const semInfo = await Promise.all(
        subjects.map(async (s) => {
          const fullSubject = await Subject.findOne({
            subjectCode: s.subjectCode,
          }).lean();
          return `**${s.subjectCode}**: Semester ${fullSubject?.semester || "N/A"
            }`;
        })
      );
      return `📅 **Your Subjects Semesters**:\n\n${semInfo.join("\n\n")}`;

    case "DEPARTMENT":
      return `🏢 **Your Department**: ${teacher.department}`;

    default:
      return (
        `Hi **${teacher.name}**! 👋\n\nI can help you with:\n\n` +
        `• "What subjects am I teaching?"\n` +
        `• "How many credits for my subjects?"\n` +
        `• "Which semester are my subjects?"\n` +
        `• "My department?"\n\n` +
        `You have **${subjects.length} subjects** assigned. What would you like to know?`
      );
  }
};

// ==================== STUDENT CHAT ====================

exports.studentChat = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, response: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "student") {
      return res
        .status(403)
        .json({ success: false, response: "Student access only" });
    }

    const { message } = req.body;
    console.log("🎓 STUDENT CHAT HIT", { usn: decoded.usn, message });

    const student = await Student.findById(decoded.id).lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        response: "Student profile not found. Please contact admin.",
      });
    }

    // ===== LLM-FIRST INTENT CLASSIFICATION =====
    const classification = await classifyIntentWithLLM(message, "student");
    console.log(`📊 LLM-First classification result:`, JSON.stringify(classification));

    let response;
    let isLLMResponse = false;
    let intent;

    if (classification.fallbackToNLP) {
      // LLM classification API failed — default to GENERAL (let LLM try to respond)
      console.log(`⚠️ LLM classification failed, defaulting to GENERAL`);
      intent = "GENERAL";
    } else if (classification.shouldUseLLM) {
      // LLM says this is a general query — let LLM respond
      intent = "GENERAL";
    } else {
      // LLM identified a specific DB intent
      intent = classification.nlpIntent;
    }

    // ===== ROUTE BASED ON INTENT =====
    if (intent === "GENERAL") {
      // Use LLM for general queries
      console.log(`✅ Routing to LLM for general response`);
      const llmResult = await generateLLMResponse(
        message,
        "student",
        student,
        decoded.id,
        "Student"
      );
      response = llmResult.response;
      isLLMResponse = llmResult.isLLM;
    } else if (intent === "LEAVE_APPLICATION") {
      // Handle leave application with email
      const leaveDetails = parseLeaveRequest(message);
      const recipientInfo = leaveDetails.recipientInfo;

      // Find recipient email
      let recipientData;
      if (recipientInfo.type === "unspecified") {
        // List available teachers and ask user to specify
        const teachers = await getAvailableTeachers(Teacher, student.department);
        const teacherList = teachers.map(t => `• **${t.name}** (${t.subjects || t.department})`).join("\n");

        response = `📋 **Who would you like to send your leave application to?**\n\n` +
          `Please specify the recipient in your message:\n\n` +
          `**Available Teachers:**\n${teacherList}\n\n` +
          `**Or send to Admin:**\n• Say "send leave to admin"\n\n` +
          `💡 **Example:**\n` +
          `"I want to apply for sick leave to Prof. Rakesh from 15th Jan to 17th Jan due to fever"`;
      } else {
        // Look up teacher email
        recipientData = await findTeacherEmail(recipientInfo, Teacher, Subject);

        if (!recipientData.found) {
          const teachers = await getAvailableTeachers(Teacher, student.department);
          const teacherList = teachers.map(t => `• ${t.name}`).join("\n");

          response = `❌ **Could not find "${recipientInfo.searchTerm || recipientInfo.subjectCode}"**\n\n` +
            `Please check the name/subject code and try again.\n\n` +
            `**Available Teachers:**\n${teacherList}\n\n` +
            `Or say "send leave to admin" to email the admin directly.`;
        } else {
          // Send email to found recipient
          const senderInfo = {
            name: student.name,
            email: student.email,
            role: "student",
            department: student.department,
            id: student.usn,
          };

          // Override recipient email and name
          leaveDetails.toEmail = recipientData.email;
          leaveDetails.recipientName = recipientData.name;
          const emailResult = await sendLeaveEmail(senderInfo, leaveDetails);

          if (emailResult.success) {
            response = `✅ **Leave Application Sent Successfully!**\n\n` +
              `📧 Your leave application has been emailed to **${recipientData.name}**.\n\n` +
              `**Details Submitted:**\n` +
              `• **To:** ${recipientData.name} (${recipientData.email})\n` +
              `• **Leave Type:** ${leaveDetails.leaveType}\n` +
              `• **From:** ${leaveDetails.fromDate || "Not specified"}\n` +
              `• **To Date:** ${leaveDetails.toDate || "Not specified"}\n` +
              `• **Reason:** ${leaveDetails.reason.substring(0, 100)}${leaveDetails.reason.length > 100 ? "..." : ""}\n\n` +
              `You will receive a response on your registered email: **${student.email}**`;
          } else {
            response = `⚠️ **Leave Application Could Not Be Sent**\n\n` +
              `${emailResult.message}\n\n` +
              `Please try again later or contact ${recipientData.name} directly.`;
          }
        }
      }
    } else if (intent === "ATTENDANCE") {
      // Fetch actual attendance data from database
      try {
        const attendanceSummary = await getStudentAttendanceSummary(student._id.toString());

        if (attendanceSummary.length === 0) {
          response = `📅 **Your Attendance**\n\n` +
            `No attendance records found yet.\n\n` +
            `💡 *Your attendance will be updated once your teachers start marking it.*`;
        } else {
          let attendanceInfo = attendanceSummary.map((subj) => {
            const statusIcon = subj.eligible ? "✅" : "❌";
            const warningText = subj.percentage < MINIMUM_ATTENDANCE_PERCENT
              ? ` ⚠️ Below ${MINIMUM_ATTENDANCE_PERCENT}%`
              : "";
            return `• **${subj.subjectCode}**: ${subj.percentage}% (${subj.present}P/${subj.absent}A/${subj.late}L) ${statusIcon}${warningText}`;
          }).join("\n");

          const overallPresent = attendanceSummary.reduce((sum, s) => sum + s.present, 0);
          const overallTotal = attendanceSummary.reduce((sum, s) => sum + s.totalClasses, 0);
          const overallPercentage = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

          const ineligibleSubjects = attendanceSummary.filter(s => !s.eligible);

          response = `📅 **Your Attendance Summary**\n\n` +
            `${attendanceInfo}\n\n` +
            `📊 **Overall**: ${overallPercentage}% across ${attendanceSummary.length} subjects\n\n`;

          if (ineligibleSubjects.length > 0) {
            response += `🚨 **Warning**: You are below ${MINIMUM_ATTENDANCE_PERCENT}% in ${ineligibleSubjects.length} subject(s). You may not be eligible to appear for SEE exams in those subjects.\n\n`;
          }

          response += `💡 *P=Present, A=Absent, L=Late. Minimum ${MINIMUM_ATTENDANCE_PERCENT}% attendance required for SEE eligibility.*`;
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
        response = `📅 **Attendance Information**\n\nSorry, I couldn't fetch your attendance right now. Please try again later or check with your department.`;
      }
    } else if (intent === "SUBJECTS") {
      // Special handling for SUBJECTS to fetch credits from Subject collection
      try {
        if (!student.marks || student.marks.length === 0) {
          response = `📚 **Your Subjects**\n\nNo subjects have been assigned to you yet. Once your teachers enter your marks, your subjects will appear here.\n\n💡 *You are in **${student.department}** department, **Semester ${student.semester}**.*`;
        } else {
          // Fetch credits for each subject
          const subjectCodes = student.marks.map(m => m.subjectCode);
          const subjectsData = await Subject.find({ subjectCode: { $in: subjectCodes } }).lean();

          const subjectsList = student.marks.map((m) => {
            const subjectInfo = subjectsData.find(s => s.subjectCode === m.subjectCode);
            const credits = subjectInfo?.credits || "N/A";
            return `• **${m.subjectCode}** - ${m.subjectName || "N/A"} (${credits} credits)`;
          }).join("\n");

          const totalCredits = subjectsData.reduce((sum, s) => sum + (s.credits || 0), 0);

          response = `📚 **Your Enrolled Subjects:**\n\n${subjectsList}\n\n📊 **Total**: ${student.marks.length} subject(s), ${totalCredits} credits\n\n💡 *Ask me "show my marks" to see your performance in each subject!*`;
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        response = generateStudentResponse(intent, student, message);
      }
    } else {
      // Use rule-based response for all other database queries
      // (BASIC_INFO, USN, COURSE, DEPARTMENT, SEMESTER, SECTION, CONTACT,
      //  MARKS, MARKS_CIE, MARKS_SEE, MARKS_PASS_STATUS, MARKS_SUBJECT)
      response = generateStudentResponse(intent, student, message);
    }

    // Save chat history to MongoDB
    await saveChatHistory(
      decoded.id,
      "Student",
      message,
      response,
      intent,
      isLLMResponse
    );

    res.json({
      success: true,
      response,
      intent,
      isLLMResponse,
      student: {
        name: student.name,
        usn: student.usn,
        email: student.email,
        phone: student.phone,
        course: student.course,
        department: student.department,
        semester: student.semester,
        section: student.section,
      },
    });
  } catch (error) {
    console.error("💥 STUDENT CHAT ERROR:", error);
    res.status(500).json({
      success: false,
      response: "Sorry, something went wrong. Please try again.",
    });
  }
};

// Student intent classification
// Uses word boundary regex to avoid false positives (e.g., "pass" in "password")
const classifyStudentIntent = (m) => {
  // Helper function to check if word exists as a whole word
  const hasWord = (text, word) => new RegExp(`\\b${word}\\b`, 'i').test(text);
  const hasAnyWord = (text, words) => words.some(w => hasWord(text, w));

  // Profile/Name queries - must be about "my name" not "username"
  if (
    m.includes("my name") ||
    m.includes("who am i") ||
    m.includes("my profile") ||
    m.includes("tell me about me")
  )
    return "BASIC_INFO";

  // USN queries
  if (hasAnyWord(m, ["usn", "roll number", "register number", "enrollment"]))
    return "USN";

  // Course queries
  if (hasAnyWord(m, ["course", "program", "degree"]) && !m.includes("password"))
    return "COURSE";

  // Department queries
  if (hasAnyWord(m, ["department", "dept", "branch"]))
    return "DEPARTMENT";

  // Semester queries
  if (hasAnyWord(m, ["semester", "sem", "which year"]) && !m.includes("see"))
    return "SEMESTER";

  // Section queries
  if (hasAnyWord(m, ["section", "division"]))
    return "SECTION";

  // Contact queries - specifically about MY contact info
  if (
    (m.includes("my email") || m.includes("my phone") || m.includes("my mobile") || m.includes("my contact")) ||
    (m.includes("contact") && (m.includes("details") || m.includes("info")))
  )
    return "CONTACT";

  // ========== ENHANCED MARKS INTENTS ==========

  // Pass/Fail status check - must be about exams not passwords
  // Exclude if contains password-related words
  if (
    !m.includes("password") &&
    !m.includes("forgot") &&
    !m.includes("reset") &&
    !m.includes("login") &&
    (
      (hasWord(m, "pass") && (m.includes("exam") || m.includes("marks") || m.includes("subject") || m.includes("did i"))) ||
      (hasWord(m, "fail") && (m.includes("exam") || m.includes("subject") || m.includes("did i"))) ||
      m.includes("passing marks") ||
      m.includes("pass or fail") ||
      m.includes("passed") ||
      m.includes("failed") ||
      m.includes("need to pass") ||
      m.includes("required to pass") ||
      (hasWord(m, "minimum") && (m.includes("marks") || m.includes("score"))) ||
      (hasWord(m, "eligibility") && m.includes("marks"))
    )
  )
    return "MARKS_PASS_STATUS";

  // CIE specific queries
  if (
    hasWord(m, "cie") ||
    m.includes("cie1") ||
    m.includes("cie2") ||
    m.includes("cie 1") ||
    m.includes("cie 2") ||
    m.includes("internal assessment") ||
    m.includes("internal marks") ||
    m.includes("internal exam") ||
    hasWord(m, "aat") ||
    m.includes("lab marks")
  )
    return "MARKS_CIE";

  // SEE specific queries - must be specific to avoid matching general "see" word
  if (
    m.includes("see marks") ||
    m.includes("see exam") ||
    m.includes("see result") ||
    m.includes("external marks") ||
    m.includes("external exam") ||
    m.includes("semester end exam") ||
    m.includes("final exam marks") ||
    m.includes("end sem")
  )
    return "MARKS_SEE";

  // Subject-specific marks (detect subject code patterns like MMC101, CS101, etc.)
  const subjectCodeMatch = m.match(/\b([a-z]{2,4}\d{2,4})\b/i);
  if (subjectCodeMatch && hasAnyWord(m, ["marks", "score", "grade", "result"]))
    return "MARKS_SUBJECT";

  // General marks queries
  if (hasAnyWord(m, ["marks", "grades", "score", "result"]) && !m.includes("password"))
    return "MARKS";

  // ========== ATTENDANCE INTENTS ==========
  if (
    m.includes("attendance") ||
    m.includes("attendence") || // common typo
    m.includes("my attendance") ||
    m.includes("my attendence") || // common typo
    m.includes("attendance percentage") ||
    m.includes("how many classes") ||
    m.includes("class attendance") ||
    m.includes("classes attended") ||
    m.includes("show attendance") ||
    m.includes("check attendance") ||
    m.includes("view attendance") ||
    (hasWord(m, "present") && m.includes("class"))
  )
    return "ATTENDANCE";

  // ========== LEAVE/EMAIL INTENTS ==========
  if (
    m.includes("apply for leave") ||
    m.includes("leave application") ||
    m.includes("sick leave") ||
    m.includes("casual leave") ||
    m.includes("medical leave") ||
    (hasWord(m, "leave") && (m.includes("apply") || m.includes("request") || m.includes("need") || m.includes("want"))) ||
    hasWord(m, "absent") ||
    m.includes("can't come") ||
    m.includes("cannot come") ||
    m.includes("won't come") ||
    m.includes("not coming") ||
    m.includes("take off") ||
    m.includes("day off")
  )
    return "LEAVE_APPLICATION";

  // Fallback to LLM for general queries (which first checks FAQs)
  return "GENERAL";
};

// Student rule-based response generation
const generateStudentResponse = (intent, student, message = "") => {
  // Pass criteria constants
  const CIE_PASS_MARKS = 25; // Minimum CIE total to pass
  const SEE_PASS_MARKS = 40; // Minimum SEE marks (out of 100) to pass, stored as 20 (out of 50)
  const SEE_PASS_STORED = 20; // SEE pass marks in stored format (40/2 = 20)

  switch (intent) {
    case "BASIC_INFO":
      return `Here is your profile:\n\n• **Name**: ${student.name
        }\n• **USN**: ${student.usn}\n• **Course**: ${student.course
        }\n• **Department**: ${student.department}\n• **Semester**: ${student.semester
        }${student.section ? `\n• **Section**: ${student.section}` : ""}`;

    case "USN":
      return `Your USN is **${student.usn}**.`;

    case "COURSE":
      return `You are enrolled in **${student.course}**.`;

    case "DEPARTMENT":
      return `Your department is **${student.department}**.`;

    case "SEMESTER":
      return `You are currently in **Semester ${student.semester}**.`;

    case "SECTION":
      return student.section
        ? `Your section is **${student.section}**.`
        : "Your section is not set in the system.";

    case "CONTACT":
      return `Your registered contact details:\n\n• **Email**: ${student.email}\n• **Phone**: ${student.phone}`;

    // ========== ENHANCED MARKS RESPONSES ==========

    case "MARKS_CIE":
      if (!student.marks || student.marks.length === 0) {
        return "No CIE marks have been recorded for you yet. Please check with your department.";
      }

      const cieDetails = student.marks.map((m) => {
        const hasLab = m.lab > 0;
        const cieTotal = m.cieTotal || ((m.cie1 || 0) + (m.cie2 || 0) + (m.aat || 0) + (m.lab || 0));
        const ciePassed = cieTotal >= CIE_PASS_MARKS;
        const needed = ciePassed ? 0 : CIE_PASS_MARKS - cieTotal;

        let details = `📚 **${m.subjectCode}** (${m.subjectName || "N/A"}):\n`;
        details += `   • CIE 1: **${m.cie1 || 0}**\n`;
        details += `   • CIE 2: **${m.cie2 || 0}**\n`;
        details += `   • AAT: **${m.aat || 0}**\n`;
        if (hasLab) details += `   • Lab: **${m.lab || 0}**\n`;
        details += `   • **CIE Total: ${cieTotal}/50** ${ciePassed ? "✅ Passed" : `❌ Need ${needed} more to pass`}`;

        return details;
      }).join("\n\n");

      return `📊 **Your CIE (Internal) Marks:**\n\n${cieDetails}\n\n💡 *Minimum ${CIE_PASS_MARKS}/50 required in CIE to pass.*`;

    case "MARKS_SEE":
      if (!student.marks || student.marks.length === 0) {
        return "No SEE marks have been recorded for you yet. Please check with your department.";
      }

      const seeDetails = student.marks.map((m) => {
        const seeStored = m.seeMarks || 0;
        const seeActual = seeStored * 2; // Convert back to /100 for display
        const seePassed = seeStored >= SEE_PASS_STORED;
        const needed = seePassed ? 0 : (SEE_PASS_MARKS - seeActual);

        return `📚 **${m.subjectCode}** (${m.subjectName || "N/A"}):\n   • SEE Marks: **${seeActual}/100** (stored: ${seeStored}/50)\n   • Status: ${seePassed ? "✅ Passed" : `❌ Need ${needed} more (out of 100) to pass`}`;
      }).join("\n\n");

      return `📊 **Your SEE (External) Marks:**\n\n${seeDetails}\n\n💡 *Minimum ${SEE_PASS_MARKS}/100 required in SEE to pass.*`;

    case "MARKS_PASS_STATUS":
      if (!student.marks || student.marks.length === 0) {
        return "No marks have been recorded for you yet. Please check with your department.";
      }

      const passStatus = student.marks.map((m) => {
        const cieTotal = m.cieTotal || ((m.cie1 || 0) + (m.cie2 || 0) + (m.aat || 0) + (m.lab || 0));
        const seeStored = m.seeMarks || 0;
        const seeActual = seeStored * 2;

        const ciePassed = cieTotal >= CIE_PASS_MARKS;
        const seePassed = seeStored >= SEE_PASS_STORED;
        const overallPassed = ciePassed && seePassed;

        const cieNeeded = ciePassed ? 0 : CIE_PASS_MARKS - cieTotal;
        const seeNeeded = seePassed ? 0 : SEE_PASS_MARKS - seeActual;

        let status = `📚 **${m.subjectCode}** (${m.subjectName || "N/A"}):\n`;
        status += `   • CIE: ${cieTotal}/50 ${ciePassed ? "✅" : `❌ (need ${cieNeeded} more)`}\n`;
        status += `   • SEE: ${seeActual}/100 ${seePassed ? "✅" : `❌ (need ${seeNeeded} more)`}\n`;
        status += `   • **Overall: ${overallPassed ? "✅ PASSED" : "❌ NOT PASSED"}**`;

        return status;
      }).join("\n\n");

      const totalSubjects = student.marks.length;
      const passedSubjects = student.marks.filter(m => {
        const cieTotal = m.cieTotal || ((m.cie1 || 0) + (m.cie2 || 0) + (m.aat || 0) + (m.lab || 0));
        return cieTotal >= CIE_PASS_MARKS && (m.seeMarks || 0) >= SEE_PASS_STORED;
      }).length;

      return `📊 **Pass/Fail Status:**\n\n${passStatus}\n\n📈 **Summary:** Passed ${passedSubjects}/${totalSubjects} subjects\n\n💡 **Passing Criteria:**\n• CIE (Internal): Minimum **${CIE_PASS_MARKS}/50**\n• SEE (External): Minimum **${SEE_PASS_MARKS}/100**`;

    case "MARKS_SUBJECT":
      if (!student.marks || student.marks.length === 0) {
        return "No marks have been recorded for you yet. Please check with your department.";
      }

      // Extract subject code from message
      const subjectMatch = message.toLowerCase().match(/\b([a-z]{2,4}\d{2,4})\b/i);
      if (!subjectMatch) {
        return "I couldn't identify the subject code. Please try again with a valid subject code like 'MMC101 marks'.";
      }

      const subjectCode = subjectMatch[1].toUpperCase();
      const subjectMarks = student.marks.find(m => m.subjectCode?.toUpperCase() === subjectCode);

      if (!subjectMarks) {
        const availableSubjects = student.marks.map(m => m.subjectCode).join(", ");
        return `No marks found for subject **${subjectCode}**.\n\n📚 Your recorded subjects: ${availableSubjects || "None"}`;
      }

      const hasLab = subjectMarks.lab > 0;
      const cieTotalSubj = subjectMarks.cieTotal || ((subjectMarks.cie1 || 0) + (subjectMarks.cie2 || 0) + (subjectMarks.aat || 0) + (subjectMarks.lab || 0));
      const seeStoredSubj = subjectMarks.seeMarks || 0;
      const seeActualSubj = seeStoredSubj * 2;
      const grandTotal = cieTotalSubj + seeStoredSubj;

      const ciePassedSubj = cieTotalSubj >= CIE_PASS_MARKS;
      const seePassedSubj = seeStoredSubj >= SEE_PASS_STORED;

      let response = `📚 **${subjectMarks.subjectCode}** - ${subjectMarks.subjectName || "N/A"}\n\n`;
      response += `**CIE Breakdown:**\n`;
      response += `• CIE 1: **${subjectMarks.cie1 || 0}**\n`;
      response += `• CIE 2: **${subjectMarks.cie2 || 0}**\n`;
      response += `• AAT: **${subjectMarks.aat || 0}**\n`;
      if (hasLab) response += `• Lab: **${subjectMarks.lab || 0}**\n`;
      response += `• **CIE Total: ${cieTotalSubj}/50** ${ciePassedSubj ? "✅" : `❌ Need ${CIE_PASS_MARKS - cieTotalSubj} more`}\n\n`;
      response += `**SEE:** ${seeActualSubj}/100 (${seeStoredSubj}/50) ${seePassedSubj ? "✅" : `❌ Need ${SEE_PASS_MARKS - seeActualSubj} more`}\n\n`;
      response += `**Grand Total: ${grandTotal}/100**\n`;
      response += `**Status: ${ciePassedSubj && seePassedSubj ? "✅ PASSED" : "❌ NOT PASSED"}**`;

      return response;

    case "MARKS":
      if (!student.marks || student.marks.length === 0) {
        return "No marks have been recorded for you yet. Please check with your department.";
      }

      const marksInfo = student.marks.map((m) => {
        const cieTotal = m.cieTotal || ((m.cie1 || 0) + (m.cie2 || 0) + (m.aat || 0) + (m.lab || 0));
        const seeStored = m.seeMarks || 0;
        const seeActual = seeStored * 2;
        const grandTotal = cieTotal + seeStored;
        const passed = cieTotal >= CIE_PASS_MARKS && seeStored >= SEE_PASS_STORED;

        return `• **${m.subjectCode}** (${m.subjectName || "N/A"}): CIE: ${cieTotal}/50, SEE: ${seeActual}/100, Total: ${grandTotal}/100 ${passed ? "✅" : "❌"}`;
      }).join("\n");

      return `📊 **Your Marks Summary:**\n\n${marksInfo}\n\n💡 *Ask me about specific subjects, CIE details, SEE marks, or pass/fail status!*`;

    case "SUBJECTS":
      if (!student.marks || student.marks.length === 0) {
        return `📚 **Your Subjects**\n\nNo subjects have been assigned to you yet. Once your teachers enter your marks, your subjects will appear here.\n\n💡 *You are in **${student.department}** department, **Semester ${student.semester}**.*`;
      }

      const subjectsList = student.marks.map((m) => {
        return `• **${m.subjectCode}** - ${m.subjectName || "N/A"}`;
      }).join("\n");

      return `📚 **Your Enrolled Subjects:**\n\n${subjectsList}\n\n📊 **Total**: ${student.marks.length} subject(s)\n\n💡 *Ask me "show my marks" to see your performance in each subject!*`;

    case "ATTENDANCE":
      return `📅 **Attendance Information**\n\nTo view your detailed attendance, please check the **Attendance** section in your dashboard sidebar.\n\n💡 *Your teacher marks attendance for each class. You can see your attendance percentage per subject there.*`;

    default:
      return `Hi **${student.name}** 👋\n\nI can help you with:\n\n• "What is my USN?"\n• "Which course/department am I in?"\n• "Which semester/section am I in?"\n• "Show my profile"\n• "Show my marks"\n• "Show my CIE/SEE marks"\n• "Did I pass?"\n• "My attendance"\n• "Apply for leave"`;
  }
};

