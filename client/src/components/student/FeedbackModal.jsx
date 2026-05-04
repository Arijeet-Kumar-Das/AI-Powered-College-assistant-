// src/components/student/FeedbackModal.jsx
import React, { useState } from "react";
import { X, Star, ChevronRight, CheckCircle, MessageSquare } from "lucide-react";
import API from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";

const FeedbackModal = ({ session, teachers, questions, onClose, onComplete }) => {
    const [currentTeacherIndex, setCurrentTeacherIndex] = useState(0);
    const [ratings, setRatings] = useState({});
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const currentTeacher = teachers[currentTeacherIndex];
    const progress = ((currentTeacherIndex) / teachers.length) * 100;

    const handleRatingChange = (questionId, value) => {
        setRatings(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmitTeacher = async () => {
        // Validate all questions answered
        const unanswered = questions.some(q => !ratings[q._id]);
        if (unanswered) {
            alert("Please answer all questions before proceeding.");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                sessionId: session._id,
                teacherId: currentTeacher._id,
                ratings: Object.entries(ratings).map(([qId, val]) => ({
                    question: qId,
                    rating: val
                })),
                comment
            };

            const token = localStorage.getItem("studentToken");
            await API.post("/api/feedback/submit", payload);

            // Clear for next teacher
            setRatings({});
            setComment("");

            // Move to next teacher or finish
            if (currentTeacherIndex < teachers.length - 1) {
                setCurrentTeacherIndex(prev => prev + 1);
            } else {
                onComplete();
            }
        } catch (error) {
            console.error("Error submitting feedback:", error);
            alert("Failed to submit feedback. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const ratingOptions = [
        { value: "excellent", label: "Excellent", color: "bg-green-100 text-green-700 hover:bg-green-200 ring-green-500" },
        { value: "good", label: "Good", color: "bg-blue-100 text-blue-700 hover:bg-blue-200 ring-blue-500" },
        { value: "average", label: "Average", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 ring-yellow-500" },
        { value: "poor", label: "Poor", color: "bg-red-100 text-red-700 hover:bg-red-200 ring-red-500" },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            {session.title}
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Feedback for {currentTeacher.name} ({currentTeacherIndex + 1}/{teachers.length})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-100 w-full">
                    <motion.div
                        className="h-full bg-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                            {currentTeacher.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">{currentTeacher.name}</h3>
                            <p className="text-sm text-gray-600">{currentTeacher.department} • {currentTeacher.subjects?.join(", ") || "N/A"}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {questions.map((q, idx) => (
                            <div key={q._id} className="space-y-3">
                                <p className="font-medium text-gray-800 flex gap-2">
                                    <span className="text-gray-400 font-mono text-sm">{idx + 1}.</span>
                                    {q.text}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-6">
                                    {ratingOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleRatingChange(q._id, option.value)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${ratings[q._id] === option.value
                                                ? `${option.color} ring-2 shadow-sm`
                                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="pt-4 border-t">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Comments (Optional)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share any constructive feedback..."
                                className="w-full border rounded-xl p-3 h-24 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                        *Your feedback is anonymous and helps improve teaching quality.
                    </p>
                    <button
                        onClick={handleSubmitTeacher}
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            "Submitting..."
                        ) : (
                            <>
                                {currentTeacherIndex < teachers.length - 1 ? "Next Teacher" : "Submit All"}
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default FeedbackModal;
