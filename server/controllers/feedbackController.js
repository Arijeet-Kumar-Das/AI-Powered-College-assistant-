// controllers/feedbackController.js
// Handles feedback sessions, questions, and responses

const FeedbackSession = require("../models/FeedbackSession");
const FeedbackQuestion = require("../models/FeedbackQuestion");
const FeedbackResponse = require("../models/FeedbackResponse");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

// ==================== ADMIN APIs ====================

// Create a new feedback session
exports.createSession = async (req, res) => {
    try {
        const { title, description, startDate, endDate, targetSemester, targetDepartment } = req.body;

        const session = new FeedbackSession({
            title,
            description,
            startDate,
            endDate,
            targetSemester: targetSemester || null,
            targetDepartment: targetDepartment || null,
            createdBy: req.admin?._id,
            isActive: false,
        });

        await session.save();
        res.status(201).json({ success: true, session });
    } catch (error) {
        console.error("Create session error:", error);
        res.status(500).json({ success: false, message: "Error creating session" });
    }
};

// Get all feedback sessions
exports.getSessions = async (req, res) => {
    try {
        const sessions = await FeedbackSession.find()
            .sort({ createdAt: -1 })
            .lean();

        // Get response counts for each session
        const sessionsWithCounts = await Promise.all(
            sessions.map(async (session) => {
                const responseCount = await FeedbackResponse.countDocuments({ session: session._id });
                return { ...session, responseCount };
            })
        );

        res.json({ success: true, sessions: sessionsWithCounts });
    } catch (error) {
        console.error("Get sessions error:", error);
        res.status(500).json({ success: false, message: "Error fetching sessions" });
    }
};

// Toggle session active status
exports.toggleSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await FeedbackSession.findById(id);

        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        session.isActive = !session.isActive;
        await session.save(); // Pre-save hook handles deactivating others

        res.json({
            success: true,
            message: session.isActive ? "Session activated" : "Session deactivated",
            session
        });
    } catch (error) {
        console.error("Toggle session error:", error);
        res.status(500).json({ success: false, message: "Error toggling session" });
    }
};

// Delete a session
exports.deleteSession = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete session and all responses
        await FeedbackResponse.deleteMany({ session: id });
        await FeedbackSession.deleteOne({ _id: id });

        res.json({ success: true, message: "Session and responses deleted" });
    } catch (error) {
        console.error("Delete session error:", error);
        res.status(500).json({ success: false, message: "Error deleting session" });
    }
};

// Get all questions
exports.getQuestions = async (req, res) => {
    try {
        // Seed default questions if none exist
        await FeedbackQuestion.seedDefaultQuestions();

        const questions = await FeedbackQuestion.find()
            .sort({ order: 1 })
            .lean();

        res.json({ success: true, questions });
    } catch (error) {
        console.error("Get questions error:", error);
        res.status(500).json({ success: false, message: "Error fetching questions" });
    }
};

// Add a question
exports.addQuestion = async (req, res) => {
    try {
        const { text, category } = req.body;
        const maxOrder = await FeedbackQuestion.findOne().sort({ order: -1 }).select("order");

        const question = new FeedbackQuestion({
            text,
            category: category || "teaching",
            order: (maxOrder?.order || 0) + 1,
        });

        await question.save();
        res.status(201).json({ success: true, question });
    } catch (error) {
        console.error("Add question error:", error);
        res.status(500).json({ success: false, message: "Error adding question" });
    }
};

// Toggle question active status
exports.toggleQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await FeedbackQuestion.findById(id);

        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }

        question.isActive = !question.isActive;
        await question.save();

        res.json({ success: true, question });
    } catch (error) {
        console.error("Toggle question error:", error);
        res.status(500).json({ success: false, message: "Error toggling question" });
    }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        await FeedbackQuestion.deleteOne({ _id: id });
        res.json({ success: true, message: "Question deleted" });
    } catch (error) {
        console.error("Delete question error:", error);
        res.status(500).json({ success: false, message: "Error deleting question" });
    }
};

// Get aggregated results for a session
exports.getSessionResults = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Get all responses for this session
        const responses = await FeedbackResponse.find({ session: sessionId })
            .populate("teacher", "name employeeId department")
            .populate("ratings.question", "text category")
            .lean();

        // Aggregate by teacher
        const teacherResults = {};
        const ratingValues = { excellent: 4, good: 3, average: 2, poor: 1 };

        responses.forEach((response) => {
            const teacherId = response.teacher._id.toString();

            if (!teacherResults[teacherId]) {
                teacherResults[teacherId] = {
                    teacher: response.teacher,
                    totalResponses: 0,
                    questionScores: {},
                    comments: [],
                };
            }

            teacherResults[teacherId].totalResponses++;

            response.ratings.forEach((r) => {
                const qId = r.question._id.toString();
                if (!teacherResults[teacherId].questionScores[qId]) {
                    teacherResults[teacherId].questionScores[qId] = {
                        question: r.question,
                        scores: [],
                    };
                }
                teacherResults[teacherId].questionScores[qId].scores.push(ratingValues[r.rating]);
            });

            if (response.comment) {
                teacherResults[teacherId].comments.push(response.comment);
            }
        });

        // Calculate averages
        const results = Object.values(teacherResults).map((t) => {
            const questionAverages = Object.values(t.questionScores).map((q) => ({
                question: q.question.text,
                category: q.question.category,
                average: (q.scores.reduce((a, b) => a + b, 0) / q.scores.length).toFixed(2),
                count: q.scores.length,
            }));

            const overallAverage = questionAverages.length > 0
                ? (questionAverages.reduce((a, q) => a + parseFloat(q.average), 0) / questionAverages.length).toFixed(2)
                : 0;

            return {
                teacher: t.teacher,
                totalResponses: t.totalResponses,
                overallAverage,
                questionAverages,
                comments: t.comments,
            };
        });

        res.json({ success: true, results });
    } catch (error) {
        console.error("Get results error:", error);
        res.status(500).json({ success: false, message: "Error fetching results" });
    }
};

// ==================== STUDENT APIs ====================

// Get active feedback session with teachers to rate
exports.getActiveSession = async (req, res) => {
    try {
        const studentId = req.student._id;
        const student = await Student.findById(studentId).lean();

        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        // Find active session
        const session = await FeedbackSession.findOne({ isActive: true }).lean();

        if (!session) {
            return res.json({ success: true, session: null, message: "No active feedback session" });
        }

        // Check if session applies to this student
        if (session.targetSemester && session.targetSemester !== student.semester) {
            return res.json({ success: true, session: null, message: "Feedback not applicable for your semester" });
        }
        if (session.targetDepartment && session.targetDepartment !== student.department) {
            return res.json({ success: true, session: null, message: "Feedback not applicable for your department" });
        }

        // Get teachers for student's department
        const teachers = await Teacher.find({ department: student.department })
            .select("name employeeId department subjects")
            .lean();

        // Get already submitted feedback
        const submitted = await FeedbackResponse.find({
            session: session._id,
            student: studentId
        }).select("teacher").lean();

        const submittedTeacherIds = submitted.map(s => s.teacher.toString());

        // Filter out teachers already rated
        const teachersToRate = teachers.filter(t => !submittedTeacherIds.includes(t._id.toString()));

        // Get active questions
        await FeedbackQuestion.seedDefaultQuestions();
        const questions = await FeedbackQuestion.find({ isActive: true })
            .sort({ order: 1 })
            .lean();

        res.json({
            success: true,
            session,
            teachersToRate,
            questions,
            submittedCount: submitted.length,
            totalTeachers: teachers.length,
        });
    } catch (error) {
        console.error("Get active session error:", error);
        res.status(500).json({ success: false, message: "Error fetching feedback session" });
    }
};

// Submit feedback
exports.submitFeedback = async (req, res) => {
    try {
        const studentId = req.student._id;
        const { sessionId, teacherId, ratings, comment } = req.body;

        // Validate session is active
        const session = await FeedbackSession.findById(sessionId);
        if (!session || !session.isActive) {
            return res.status(400).json({ success: false, message: "Feedback session is not active" });
        }

        // Check if already submitted
        const existing = await FeedbackResponse.findOne({
            session: sessionId,
            student: studentId,
            teacher: teacherId,
        });

        if (existing) {
            return res.status(400).json({ success: false, message: "You have already submitted feedback for this teacher" });
        }

        // Create response
        const response = new FeedbackResponse({
            session: sessionId,
            student: studentId,
            teacher: teacherId,
            ratings,
            comment: comment || "",
        });

        await response.save();

        res.json({ success: true, message: "Feedback submitted successfully" });
    } catch (error) {
        console.error("Submit feedback error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate feedback submission" });
        }
        res.status(500).json({ success: false, message: "Error submitting feedback" });
    }
};

// ==================== TEACHER API ====================

// Get own feedback results (anonymized)
exports.getOwnFeedback = async (req, res) => {
    try {
        const teacherId = req.teacher._id;

        // Get all feedback for this teacher
        const responses = await FeedbackResponse.find({ teacher: teacherId })
            .populate("session", "title startDate endDate")
            .populate("ratings.question", "text category")
            .lean();

        // Group by session
        const sessionResults = {};
        const ratingValues = { excellent: 4, good: 3, average: 2, poor: 1 };

        responses.forEach((response) => {
            const sessionId = response.session._id.toString();

            if (!sessionResults[sessionId]) {
                sessionResults[sessionId] = {
                    session: response.session,
                    totalResponses: 0,
                    questionScores: {},
                    comments: [],
                };
            }

            sessionResults[sessionId].totalResponses++;

            response.ratings.forEach((r) => {
                const qId = r.question._id.toString();
                if (!sessionResults[sessionId].questionScores[qId]) {
                    sessionResults[sessionId].questionScores[qId] = {
                        question: r.question,
                        scores: [],
                    };
                }
                sessionResults[sessionId].questionScores[qId].scores.push(ratingValues[r.rating]);
            });

            if (response.comment) {
                sessionResults[sessionId].comments.push(response.comment);
            }
        });

        // Calculate averages
        const results = Object.values(sessionResults).map((s) => {
            const questionAverages = Object.values(s.questionScores).map((q) => ({
                question: q.question.text,
                category: q.question.category,
                average: (q.scores.reduce((a, b) => a + b, 0) / q.scores.length).toFixed(2),
            }));

            const overallAverage = questionAverages.length > 0
                ? (questionAverages.reduce((a, q) => a + parseFloat(q.average), 0) / questionAverages.length).toFixed(2)
                : 0;

            return {
                session: s.session,
                totalResponses: s.totalResponses,
                overallAverage,
                questionAverages,
                comments: s.comments, // Anonymous comments
            };
        });

        res.json({ success: true, results });
    } catch (error) {
        console.error("Get own feedback error:", error);
        res.status(500).json({ success: false, message: "Error fetching feedback" });
    }
};
