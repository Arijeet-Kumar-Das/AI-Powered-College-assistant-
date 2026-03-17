// controllers/noticeController.js
// CRUD operations for notices

const Notice = require("../models/Notice");

// Get all notices (with filters)
exports.getAllNotices = async (req, res) => {
    try {
        const { priority, targetAudience, status = "active", search } = req.query;

        const filter = { status };

        if (priority && priority !== "all") {
            filter.priority = priority;
        }

        if (targetAudience && targetAudience !== "all") {
            filter.targetAudience = { $in: [targetAudience, "all"] };
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const notices = await Notice.find(filter)
            .sort({ isPinned: -1, createdAt: -1 })
            .lean();

        res.json({
            success: true,
            count: notices.length,
            notices,
        });
    } catch (error) {
        console.error("Error fetching notices:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single notice by ID
exports.getNoticeById = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ success: false, message: "Notice not found" });
        }

        // Increment view count
        notice.views = (notice.views || 0) + 1;
        await notice.save();

        res.json({ success: true, notice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create new notice
exports.createNotice = async (req, res) => {
    try {
        const { title, description, priority, targetAudience, expiryDate, isPinned } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required"
            });
        }

        const notice = new Notice({
            title,
            description,
            priority: priority || "normal",
            targetAudience: targetAudience || "all",
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            isPinned: isPinned || false,
            status: "active",
            views: 0,
        });

        await notice.save();

        res.status(201).json({
            success: true,
            message: "Notice created successfully",
            notice,
        });
    } catch (error) {
        console.error("Error creating notice:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update notice
exports.updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const notice = await Notice.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!notice) {
            return res.status(404).json({ success: false, message: "Notice not found" });
        }

        res.json({
            success: true,
            message: "Notice updated successfully",
            notice,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete notice
exports.deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findByIdAndDelete(req.params.id);

        if (!notice) {
            return res.status(404).json({ success: false, message: "Notice not found" });
        }

        res.json({
            success: true,
            message: "Notice deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle pin status
exports.togglePin = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ success: false, message: "Notice not found" });
        }

        notice.isPinned = !notice.isPinned;
        await notice.save();

        res.json({
            success: true,
            message: `Notice ${notice.isPinned ? "pinned" : "unpinned"} successfully`,
            notice,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Archive notice
exports.archiveNotice = async (req, res) => {
    try {
        const notice = await Notice.findByIdAndUpdate(
            req.params.id,
            { status: "archived" },
            { new: true }
        );

        if (!notice) {
            return res.status(404).json({ success: false, message: "Notice not found" });
        }

        res.json({
            success: true,
            message: "Notice archived successfully",
            notice,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get notices for students (public endpoint)
exports.getNoticesForStudents = async (req, res) => {
    try {
        const notices = await Notice.find({
            status: "active",
            targetAudience: { $in: ["all", "students"] },
            $or: [
                { expiryDate: { $gte: new Date() } },
                { expiryDate: null }
            ]
        })
            .select("title description priority isPinned createdAt")
            .sort({ isPinned: -1, priority: -1, createdAt: -1 })
            .lean();

        res.json({ success: true, notices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get notices for faculty (public endpoint)
exports.getNoticesForFaculty = async (req, res) => {
    try {
        const notices = await Notice.find({
            status: "active",
            targetAudience: { $in: ["all", "faculty"] },
            $or: [
                { expiryDate: { $gte: new Date() } },
                { expiryDate: null }
            ]
        })
            .select("title description priority isPinned createdAt")
            .sort({ isPinned: -1, priority: -1, createdAt: -1 })
            .lean();

        res.json({ success: true, notices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
