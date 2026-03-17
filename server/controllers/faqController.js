// controllers/faqController.js
// CRUD operations for FAQs

const FAQ = require("../models/FAQ");

// Get all FAQs (with filters)
exports.getAllFAQs = async (req, res) => {
    try {
        const { category, status = "active", search } = req.query;

        const filter = {};

        if (status !== "all") {
            filter.status = status;
        }

        if (category && category !== "all") {
            filter.category = category;
        }

        if (search) {
            filter.$or = [
                { question: { $regex: search, $options: "i" } },
                { answer: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
            ];
        }

        const faqs = await FAQ.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            count: faqs.length,
            faqs,
        });
    } catch (error) {
        console.error("Error fetching FAQs:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single FAQ by ID
exports.getFAQById = async (req, res) => {
    try {
        const faq = await FAQ.findById(req.params.id);

        if (!faq) {
            return res.status(404).json({ success: false, message: "FAQ not found" });
        }

        res.json({ success: true, faq });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create new FAQ
exports.createFAQ = async (req, res) => {
    try {
        const { question, answer, category, tags } = req.body;

        if (!question || !answer) {
            return res.status(400).json({
                success: false,
                message: "Question and answer are required"
            });
        }

        // Process tags - split by comma if string
        const processedTags = typeof tags === "string"
            ? tags.split(",").map(t => t.trim()).filter(t => t)
            : (tags || []);

        const faq = new FAQ({
            question,
            answer,
            category: category || "general",
            tags: processedTags,
            status: "active",
        });

        await faq.save();

        res.status(201).json({
            success: true,
            message: "FAQ created successfully",
            faq,
        });
    } catch (error) {
        console.error("Error creating FAQ:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update FAQ
exports.updateFAQ = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // Process tags if provided
        if (updates.tags && typeof updates.tags === "string") {
            updates.tags = updates.tags.split(",").map(t => t.trim()).filter(t => t);
        }

        const faq = await FAQ.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!faq) {
            return res.status(404).json({ success: false, message: "FAQ not found" });
        }

        res.json({
            success: true,
            message: "FAQ updated successfully",
            faq,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete FAQ
exports.deleteFAQ = async (req, res) => {
    try {
        const faq = await FAQ.findByIdAndDelete(req.params.id);

        if (!faq) {
            return res.status(404).json({ success: false, message: "FAQ not found" });
        }

        res.json({
            success: true,
            message: "FAQ deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Search FAQs by query (for chatbot)
exports.searchFAQs = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ success: false, message: "Search query required" });
        }

        // Search using text index or regex
        const faqs = await FAQ.find({
            status: "active",
            $or: [
                { question: { $regex: q, $options: "i" } },
                { answer: { $regex: q, $options: "i" } },
                { tags: { $regex: q, $options: "i" } },
            ],
        })
            .limit(5)
            .lean();

        res.json({ success: true, faqs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get FAQ answer by matching question (for chatbot)
exports.getAnswerForQuestion = async (q) => {
    try {
        if (!q) return null;

        const lowerQ = q.toLowerCase();

        // Find best matching FAQ
        const faqs = await FAQ.find({ status: "active" }).lean();

        // Simple keyword matching
        for (const faq of faqs) {
            const faqQ = faq.question.toLowerCase();
            const faqTags = faq.tags.map(t => t.toLowerCase());

            // Check if question matches
            if (faqQ.includes(lowerQ) || lowerQ.includes(faqQ)) {
                return faq;
            }

            // Check if any tag matches
            for (const tag of faqTags) {
                if (lowerQ.includes(tag)) {
                    return faq;
                }
            }
        }

        // Fuzzy matching - check word overlap
        const queryWords = lowerQ.split(/\s+/).filter(w => w.length > 3);
        let bestMatch = null;
        let maxScore = 0;

        for (const faq of faqs) {
            const faqWords = faq.question.toLowerCase().split(/\s+/);
            let score = 0;

            for (const word of queryWords) {
                if (faqWords.some(fw => fw.includes(word) || word.includes(fw))) {
                    score++;
                }
            }

            if (score > maxScore && score >= 2) {
                maxScore = score;
                bestMatch = faq;
            }
        }

        return bestMatch;
    } catch (error) {
        console.error("Error searching FAQs:", error);
        return null;
    }
};

// Get all active FAQs for public display
exports.getPublicFAQs = async (req, res) => {
    try {
        const { category } = req.query;

        const filter = { status: "active" };
        if (category && category !== "all") {
            filter.category = category;
        }

        const faqs = await FAQ.find(filter)
            .select("question answer category tags")
            .sort({ category: 1, createdAt: -1 })
            .lean();

        res.json({ success: true, faqs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
