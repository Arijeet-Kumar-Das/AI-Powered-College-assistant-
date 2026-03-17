// services/llmService.js
// LLM Service using local Ollama for inference

const { chatWithHuggingFace, HF_MODEL } = require("./huggingfaceService");
const Chat = require("../models/Chat");

/**
 * Build a system prompt that provides user context to the LLM
 * without allowing hallucination of private data
 */
const buildSystemPrompt = (userType, userContext) => {
    const baseInstructions = `You are a helpful AI assistant for B.M.S. College. 
You are speaking with a ${userType}.

CRITICAL RULES:
1. You may ONLY reference the user data provided below - do NOT invent or hallucinate any personal information
2. If asked about data not provided, say "I don't have access to that information. Please contact the admin."
3. Be helpful, friendly, and concise
4. Format responses with markdown for better readability
5. If the user asks about college policies, schedules, or information not in your context, provide general guidance and suggest contacting the administration
6. Never reveal raw database IDs or sensitive system information

USER CONTEXT:
`;

    if (userType === "student") {
        return (
            baseInstructions +
            `
- Name: ${userContext.name}
- USN: ${userContext.usn}
- Email: ${userContext.email}
- Phone: ${userContext.phone}
- Course: ${userContext.course}
- Department: ${userContext.department}
- Semester: ${userContext.semester}
- Section: ${userContext.section || "Not assigned"}
${userContext.marks?.length > 0
                ? `- Has marks recorded for ${userContext.marks.length} subject(s)`
                : "- No marks recorded yet"
            }

You can help this student with:
- General academic questions
- Career guidance
- Study tips
- College-related information
- Explaining concepts
`
        );
    } else if (userType === "teacher") {
        const subjectsList =
            userContext.subjectsAssigned
                ?.map((s) => `${s.subjectCode}: ${s.subjectName}`)
                .join(", ") || "None assigned";

        return (
            baseInstructions +
            `
- Name: ${userContext.name}
- Employee ID: ${userContext.employeeId}
- Email: ${userContext.email}
- Department: ${userContext.department}
- Subjects Teaching: ${subjectsList}

You can help this teacher with:
- Teaching methodologies
- Academic best practices
- General educational guidance
- College-related queries
`
        );
    }

    return baseInstructions + "No specific user context available.";
};

/**
 * Fetch recent chat history for context
 */
const getChatHistory = async (userId, userModel, limit = 10) => {
    try {
        const history = await Chat.find({
            userId,
            userModel,
        })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();

        // Reverse to get chronological order (oldest first)
        return history
            .reverse()
            .map((chat) => [
                { role: "user", content: chat.message },
                { role: "assistant", content: chat.botResponse },
            ])
            .flat();
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return [];
    }
};

/**
 * Generate LLM response for general queries using Ollama
 */
const generateLLMResponse = async (
    message,
    userType,
    userContext,
    userId,
    userModel
) => {
    try {
        // Build system prompt with user context
        const systemPrompt = buildSystemPrompt(userType, userContext);

        // Fetch recent chat history for context
        const chatHistory = await getChatHistory(userId, userModel);

        // Build messages array for Ollama
        const messages = [
            { role: "system", content: systemPrompt },
            ...chatHistory,
            { role: "user", content: message },
        ];

        console.log(
            ` Calling Hugging Face (${HF_MODEL}) for ${userType} query: "${message.substring(0, 50)}..."`
        );

        // Call Hugging Face API
        const result = await chatWithHuggingFace(messages);

        if (!result.success) {
            console.error("Hugging Face Error:", result.message);

            if (result.error === "missing_api_token") {
                return {
                    success: false,
                    response:
                        "The AI service is not configured. Please set HUGGINGFACE_API_TOKEN in .env",
                    isLLM: false,
                    error: result.error,
                };
            }

            if (result.error === "model_loading") {
                return {
                    success: false,
                    response: result.message,
                    isLLM: false,
                    error: result.error,
                };
            }

            if (result.error === "rate_limited") {
                return {
                    success: false,
                    response: "The AI service is busy. Please wait a moment and try again.",
                    isLLM: false,
                    error: result.error,
                };
            }

            return {
                success: false,
                response: `I'm having trouble connecting to my AI brain right now. 🤔\n\nPlease try again in a moment, or ask me about:\n• Your profile information\n• Your ${userType === "student" ? "academic details" : "teaching assignments"}`,
                isLLM: false,
                error: result.message,
            };
        }

        console.log(`Hugging Face response received (${result.content.length} chars)`);

        return {
            success: true,
            response: result.content,
            isLLM: true,
            model: result.model,
        };
    } catch (error) {
        console.error("LLM Service Error:", error.message);

        return {
            success: false,
            response: `I'm having trouble connecting to my AI brain right now. \n\nPlease try again in a moment, or ask me about:\n• Your profile information\n• Your ${userType === "student" ? "academic details" : "teaching assignments"}`,
            isLLM: false,
            error: error.message,
        };
    }
};

/**
 * Save chat exchange to MongoDB
 */
const saveChatHistory = async (
    userId,
    userModel,
    message,
    botResponse,
    intent,
    isLLMResponse = false,
    sessionId = null
) => {
    try {
        const chat = new Chat({
            userId,
            userModel,
            message,
            botResponse,
            intent,
            isLLMResponse,
            sessionId: sessionId || `session_${userId}_${Date.now()}`,
            timestamp: new Date(),
        });

        await chat.save();
        console.log(
            `Chat saved to MongoDB (intent: ${intent}, LLM: ${isLLMResponse})`
        );
        return chat;
    } catch (error) {
        console.error("Error saving chat history:", error);
        return null;
    }
};

/**
 * LLM-First Intent Classifier (PRIMARY ENTRY POINT)
 * 
 * Every user message comes here FIRST. The LLM decides whether the query
 * needs user-specific database data (routed to NLP/rule-based handlers)
 * or is a general knowledge question (handled directly by the LLM).
 * 
 * Quick keyword shortcuts are kept as an optimization layer to save API calls
 * for obvious database queries.
 * 
 * @param {string} message - The user's message
 * @param {string} userType - "student" or "teacher"
 * @returns {{ shouldUseLLM: boolean, nlpIntent: string | null }}
 */
const classifyIntentWithLLM = async (message, userType) => {
    try {
        // ============================================================
        // ALL messages go directly to the LLM for classification.
        // The LLM decides whether it's a general query or a DB query.
        // ============================================================

        // Build role-specific classification prompt
        const intentList = userType === "student"
            ? `  * "BASIC_INFO" - User asking about THEIR profile, name, who they are
  * "USN" - User asking about THEIR USN, roll number, enrollment number
  * "COURSE" - User asking about THEIR course, program, degree
  * "DEPARTMENT" - User asking about THEIR department, branch
  * "SEMESTER" - User asking about THEIR current semester
  * "SECTION" - User asking about THEIR section or division
  * "CONTACT" - User asking about THEIR email, phone, contact details
  * "MARKS" - User asking about THEIR overall marks, grades, results
  * "MARKS_CIE" - User asking about THEIR CIE/internal/AAT/lab marks specifically
  * "MARKS_SEE" - User asking about THEIR SEE/external/semester-end exam marks
  * "MARKS_PASS_STATUS" - User asking if THEY passed or failed, pass/fail status
  * "MARKS_SUBJECT" - User asking about marks for a SPECIFIC subject (mentions subject code)
  * "ATTENDANCE" - User asking about THEIR attendance percentage, classes attended
  * "SUBJECTS" - User asking what subjects THEY are enrolled in
  * "LEAVE_APPLICATION" - User requesting to apply for leave, absent, can't come`
            : `  * "MY_SUBJECTS" - Teacher asking what subjects THEY are teaching/handling
  * "SUBJECT_CREDITS" - Teacher asking about credits of THEIR subjects
  * "SEMESTER_INFO" - Teacher asking which semester THEIR subjects belong to
  * "DEPARTMENT" - Teacher asking about THEIR department
  * "LEAVE_APPLICATION" - Teacher requesting to apply for leave, absent, can't come`;

        const validIntentNames = userType === "student"
            ? "LLM, BASIC_INFO, USN, COURSE, DEPARTMENT, SEMESTER, SECTION, CONTACT, MARKS, MARKS_CIE, MARKS_SEE, MARKS_PASS_STATUS, MARKS_SUBJECT, ATTENDANCE, SUBJECTS, or LEAVE_APPLICATION"
            : "LLM, MY_SUBJECTS, SUBJECT_CREDITS, SEMESTER_INFO, DEPARTMENT, or LEAVE_APPLICATION";

        const classificationPrompt = `You are an intent classifier for a college assistant chatbot. The user is a ${userType}.

TASK: Classify if this message needs USER-SPECIFIC DATABASE DATA or is a GENERAL KNOWLEDGE question.

USER MESSAGE: "${message}"

CLASSIFICATION RULES:
- Answer "LLM" if the user is asking for:
  * General knowledge (algorithms, programming, concepts, definitions)
  * Career advice, study tips, explanations of concepts
  * Coding help, debugging, technical concepts
  * College policies, general information
  * Greetings, casual conversation
  * Anything that does NOT require the user's personal data from database

- Answer with a specific intent ONLY if the user is asking about THEIR OWN PERSONAL DATA:
${intentList}

EXAMPLES:
- "Dijkstra's algorithm in C" → LLM
- "What is machine learning?" → LLM
- "How to prepare for exams?" → LLM
- "Hello" → LLM
- "Thank you" → LLM
- "What is my attendance?" → ATTENDANCE
- "Show my marks" → MARKS
- "What is my USN?" → ${userType === "student" ? "USN" : "LLM"}
- "Did I pass?" → ${userType === "student" ? "MARKS_PASS_STATUS" : "LLM"}
- "Apply for sick leave" → LEAVE_APPLICATION

RESPOND WITH EXACTLY ONE WORD: ${validIntentNames}`;

        const messages = [
            { role: "system", content: "You are an intent classifier. Respond with EXACTLY ONE WORD from the options given. No explanation, no punctuation, just the intent word." },
            { role: "user", content: classificationPrompt }
        ];

        console.log(`🤖 LLM-First: Classifying ${userType} message: "${message.substring(0, 60)}..."`);

        const result = await chatWithHuggingFace(messages, { max_tokens: 15, temperature: 0.1 });

        if (!result.success) {
            console.log(`⚠️ LLM classification failed (${result.error}), falling back to NLP`);
            return { shouldUseLLM: null, nlpIntent: null, fallbackToNLP: true };
        }

        // Clean and parse the response
        const rawResponse = result.content.trim();
        const classification = rawResponse.toUpperCase().replace(/[^A-Z_]/g, '');
        console.log(`🤖 LLM Classification: raw="${rawResponse}" → parsed="${classification}"`);

        // Check for LLM (general query)
        if (classification === "LLM" || rawResponse.toLowerCase().includes("llm")) {
            console.log(`✅ LLM says: General query → handle with LLM`);
            return { shouldUseLLM: true, nlpIntent: null };
        }

        // Check for valid NLP intents based on role
        const validIntents = userType === "student"
            ? ["BASIC_INFO", "USN", "COURSE", "DEPARTMENT", "SEMESTER", "SECTION", "CONTACT",
               "MARKS", "MARKS_CIE", "MARKS_SEE", "MARKS_PASS_STATUS", "MARKS_SUBJECT",
               "ATTENDANCE", "SUBJECTS", "LEAVE_APPLICATION"]
            : ["MY_SUBJECTS", "SUBJECT_CREDITS", "SEMESTER_INFO", "DEPARTMENT", "LEAVE_APPLICATION"];

        for (const intent of validIntents) {
            if (classification === intent || classification.includes(intent)) {
                console.log(`🔄 LLM says: DB query → route to NLP intent: ${intent}`);
                return { shouldUseLLM: false, nlpIntent: intent };
            }
        }

        // If we can't determine, default to LLM (safer for general queries)
        console.log(`❓ Unclear classification "${classification}", defaulting to LLM`);
        return { shouldUseLLM: true, nlpIntent: null };

    } catch (error) {
        console.error("❌ LLM Intent Classification Error:", error.message);
        // On error, signal fallback to NLP classifier
        return { shouldUseLLM: null, nlpIntent: null, fallbackToNLP: true };
    }
};

module.exports = {
    generateLLMResponse,
    saveChatHistory,
    getChatHistory,
    classifyIntentWithLLM,
};
