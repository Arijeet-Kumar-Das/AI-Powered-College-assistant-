// src/components/teacher/TeacherFeedbackView.jsx
import React, { useState, useEffect } from "react";
import { Star, MessageSquare, TrendingUp, Calendar, Loader2 } from "lucide-react";
import API from "../../utils/api";

const TeacherFeedbackView = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const token = localStorage.getItem("teacherToken");
            const res = await API.get("/api/teacher/feedback/my-results");
            if (res.data.success) {
                setResults(res.data.results);
            }
        } catch (error) {
            console.error("Error fetching feedback:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">No Feedback Yet</h3>
                <p className="text-gray-500 mt-2">Feedback collected from students will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Student Feedback</h2>
                <p className="text-gray-500">Anonymous ratings and reviews from your students</p>
            </div>

            <div className="grid gap-6">
                {results.map((sessionResult, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Session Header */}
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{sessionResult.session.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(sessionResult.session.startDate).toLocaleDateString()}
                                    </span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                        {sessionResult.totalResponses} Responses
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-purple-600">{sessionResult.overallAverage}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Overall Rating</div>
                                </div>
                                <div className="w-12 h-12 rounded-full border-4 border-purple-100 flex items-center justify-center bg-purple-50">
                                    <Star className="w-6 h-6 text-purple-600 fill-current" />
                                </div>
                            </div>
                        </div>

                        {/* Detailed Ratings */}
                        <div className="p-6 grid md:grid-cols-2 gap-8">
                            {/* Question Breakdown */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Rating Breakdown
                                </h4>
                                <div className="space-y-3">
                                    {sessionResult.questionAverages.map((qa, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">{qa.question}</span>
                                                <span className="font-medium text-gray-800">{qa.average}</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${parseFloat(qa.average) >= 3 ? "bg-green-500" :
                                                            parseFloat(qa.average) >= 2 ? "bg-yellow-500" : "bg-red-500"
                                                        }`}
                                                    style={{ width: `${(qa.average / 4) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Student Comments
                                </h4>
                                <div className="bg-gray-50 rounded-xl p-4 h-64 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                                    {sessionResult.comments.length > 0 ? (
                                        sessionResult.comments.map((comment, i) => (
                                            <div key={i} className="bg-white p-3 rounded-lg shadow-sm text-sm text-gray-600 italic border-l-4 border-purple-300">
                                                "{comment}"
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-400 text-center py-8 text-sm">No comments provided.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeacherFeedbackView;
