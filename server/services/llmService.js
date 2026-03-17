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
 * LLM-based Intent Classifier
 * When NLP rules fall through to GENERAL, we ask the LLM to verify if this is truly 
 * a general question or if it should be routed to NLP with a specific intent.
 * 
 * Returns: { shouldUseLLM: boolean, nlpIntent: string | null }
 */
const classifyIntentWithLLM = async (message, userType) => {
    try {
        const lowerMsg = message.toLowerCase();

        // Quick keyword check BEFORE calling LLM - catch obvious user-specific queries
        // This saves API calls and ensures accuracy for common patterns
        if (lowerMsg.includes("my attendance") || lowerMsg.includes("my attendence") ||
            (lowerMsg.includes("attendance") && !lowerMsg.includes("what is attendance"))) {
            console.log(`⚡ Quick match: ATTENDANCE (keyword detected)`);
            return { shouldUseLLM: false, nlpIntent: "ATTENDANCE" };
        }
        if (lowerMsg.includes("my marks") || lowerMsg.includes("my grades") ||
            lowerMsg.includes("my score") || lowerMsg.includes("show marks")) {
            console.log(`⚡ Quick match: MARKS (keyword detected)`);
            return { shouldUseLLM: false, nlpIntent: "MARKS" };
        }
        if (lowerMsg.includes("my usn") || lowerMsg.includes("my profile") ||
            lowerMsg.includes("my name") || lowerMsg.includes("my department")) {
            console.log(`⚡ Quick match: BASIC_INFO (keyword detected)`);
            return { shouldUseLLM: false, nlpIntent: "BASIC_INFO" };
        }
        if (lowerMsg.includes("my subject") || lowerMsg.includes("my course")) {
            console.log(`⚡ Quick match: SUBJECTS (keyword detected)`);
            return { shouldUseLLM: false, nlpIntent: "SUBJECTS" };
        }
        if (lowerMsg.includes("apply") && lowerMsg.includes("leave")) {
            console.log(`⚡ Quick match: LEAVE_APPLICATION (keyword detected)`);
            return { shouldUseLLM: false, nlpIntent: "LEAVE_APPLICATION" };
        }

        // If no quick match, use LLM for classification
        const classificationPrompt = `You are an intent classifier for a college assistant chatbot.

TASK: Classify if this message needs USER-SPECIFIC DATABASE DATA or is a GENERAL KNOWLEDGE question.

USER MESSAGE: "${message}"

CLASSIFICATION RULES:
- Answer "LLM" if the user is asking for:
  * General knowledge (algorithms, programming, concepts, definitions)
  * Career advice, study tips, explanations
  * Coding help, debugging, technical concepts
  * Anything that does NOT require the user's personal data from database

- Answer with a specific NLP intent ONLY if the user is asking about THEIR OWN DATA:
  * "BASIC_INFO" - User asking about THEIR profile, USN, name, department, email
  * "MARKS" - User asking about THEIR marks, grades, CIE, SEE scores  
  * "ATTENDANCE" - User asking about THEIR attendance percentage
  * "SUBJECTS" - User asking what subjects THEY are enrolled in
  * "LEAVE_APPLICATION" - User requesting to apply for leave

EXAMPLES:
- "Dijkstra's algorithm in C" → LLM (general programming knowledge)
- "What is machine learning?" → LLM (general concept)
- "How to prepare for exams?" → LLM (general advice)
- "What is my attendance?" → ATTENDANCE (user's personal data)
- "Show my marks" → MARKS (user's personal data)
- "What is my USN?" → BASIC_INFO (user's personal data)

RESPOND WITH EXACTLY ONE WORD: LLM, BASIC_INFO, MARKS, ATTENDANCE, SUBJECTS, or LEAVE_APPLICATION`;

        const messages = [
            { role: "system", content: "You are an intent classifier. Respond with EXACTLY ONE WORD from the options given. No explanation." },
            { role: "user", content: classificationPrompt }
        ];

        console.log(` Asking LLM to classify: "${message.substring(0, 50)}..."`);

        const result = await chatWithHuggingFace(messages, { max_tokens: 15, temperature: 0.1 });

        if (!result.success) {
            console.log("LLM classification failed, defaulting to LLM handling");
            return { shouldUseLLM: true, nlpIntent: null };
        }

        // Clean and parse the response
        const rawResponse = result.content.trim();
        const classification = rawResponse.toUpperCase().replace(/[^A-Z_]/g, '');
        console.log(`LLM Classification raw: "${rawResponse}" → parsed: "${classification}"`);

        // Check for LLM first (most common case for general queries)
        if (classification === "LLM" || rawResponse.toLowerCase().includes("llm")) {
            console.log(`Routing to LLM for general response`);
            return { shouldUseLLM: true, nlpIntent: null };
        }

        // Check for valid NLP intents
        const validIntents = ["BASIC_INFO", "MARKS", "ATTENDANCE", "SUBJECTS", "LEAVE_APPLICATION"];

        for (const intent of validIntents) {
            if (classification === intent || classification.includes(intent)) {
                console.log(`🔄 Routing to NLP intent: ${intent}`);
                return { shouldUseLLM: false, nlpIntent: intent };
            }
        }

        // If we can't determine, default to LLM (safer for general queries)
        console.log(`Unclear classification "${classification}", defaulting to LLM`);
        return { shouldUseLLM: true, nlpIntent: null };

    } catch (error) {
        console.error("LLM Intent Classification Error:", error.message);
        // On error, default to using LLM
        return { shouldUseLLM: true, nlpIntent: null };
    }
};

module.exports = {
    generateLLMResponse,
    saveChatHistory,
    getChatHistory,
    classifyIntentWithLLM,
};
