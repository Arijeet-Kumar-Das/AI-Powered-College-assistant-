// services/huggingfaceService.js
// Hugging Face Inference Providers (OpenAI-compatible API) client

const axios = require("axios");

// Hugging Face Inference Providers - OpenAI-compatible endpoint
const HF_BASE_URL = "https://router.huggingface.co/v1";
const HF_MODEL = process.env.HUGGINGFACE_MODEL || "meta-llama/Llama-3.2-3B-Instruct";
const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

/**
 * Call Hugging Face Inference Providers (OpenAI-compatible) for chat completion
 * @param {Array} messages - Array of {role, content} objects (OpenAI format)
 * @param {Object} options - Optional settings { max_tokens, temperature, top_p }
 * @returns {Promise<object>} - The assistant's response
 */
const chatWithHuggingFace = async (messages, options = {}) => {
    if (!HF_API_TOKEN) {
        return {
            success: false,
            error: "missing_api_token",
            message: "Hugging Face API token not configured. Set HUGGINGFACE_API_TOKEN in .env",
        };
    }

    const maxTokens = options.max_tokens || 1500;
    const temperature = options.temperature || 0.7;
    const topP = options.top_p || 0.9;

    try {
        // OpenAI-compatible chat completions endpoint
        const response = await axios.post(
            `${HF_BASE_URL}/chat/completions`,
            {
                model: HF_MODEL,
                messages: messages,
                max_tokens: maxTokens,
                temperature: temperature,
                top_p: topP,
                stream: false,
            },
            {
                headers: {
                    "Authorization": `Bearer ${HF_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
                timeout: 60000, // 60 second timeout
            }
        );

        // OpenAI-compatible response format
        if (response.data?.choices?.[0]?.message?.content) {
            return {
                success: true,
                content: response.data.choices[0].message.content.trim(),
                model: response.data.model || HF_MODEL,
            };
        }

        console.error("Unexpected HF response format:", response.data);
        throw new Error("Invalid response format from Hugging Face");

    } catch (error) {
        console.error("Hugging Face API Error:", JSON.stringify(error.response?.data, null, 2) || error.message);
        console.error("Status:", error.response?.status);

        // Handle specific error cases
        if (error.response?.status === 401) {
            return {
                success: false,
                error: "invalid_token",
                message: "Invalid Hugging Face API token. Check your HUGGINGFACE_API_TOKEN.",
            };
        }

        if (error.response?.status === 503) {
            // Model is loading
            const estimatedTime = error.response.data?.estimated_time || 20;
            return {
                success: false,
                error: "model_loading",
                message: `Model is loading. Please try again in ~${Math.ceil(estimatedTime)} seconds.`,
            };
        }

        if (error.response?.status === 429) {
            return {
                success: false,
                error: "rate_limited",
                message: "Rate limited by Hugging Face. Please wait a moment and try again.",
            };
        }

        if (error.response?.status === 422) {
            return {
                success: false,
                error: "validation_error",
                message: error.response.data?.error?.message || "Invalid request format.",
            };
        }

        if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
            return {
                success: false,
                error: "network_error",
                message: "Cannot connect to Hugging Face API. Check your internet connection.",
            };
        }

        return {
            success: false,
            error: "hf_error",
            message: error.response?.data?.error?.message || error.response?.data?.error || error.message,
        };
    }
};

/**
 * Check if Hugging Face Inference Providers API is available
 */
const checkHuggingFaceHealth = async () => {
    if (!HF_API_TOKEN) {
        return {
            online: false,
            error: "No API token configured",
        };
    }

    try {
        // List available models
        const response = await axios.get(
            `${HF_BASE_URL}/models`,
            {
                headers: {
                    "Authorization": `Bearer ${HF_API_TOKEN}`,
                },
                timeout: 5000,
            }
        );

        return {
            online: true,
            model: HF_MODEL,
            availableModels: response.data?.data?.length || 0,
        };
    } catch (error) {
        // Even if models endpoint fails, API might still work
        return {
            online: true,
            model: HF_MODEL,
            note: "Could not list models, but API may still work",
        };
    }
};

module.exports = {
    chatWithHuggingFace,
    checkHuggingFaceHealth,
    HF_MODEL,
};
