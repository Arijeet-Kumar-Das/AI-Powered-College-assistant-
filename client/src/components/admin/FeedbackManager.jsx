// src/components/admin/FeedbackManager.jsx
import React, { useState, useEffect } from "react";
import {
    MessageSquare,
    Plus,
    Calendar,
    Eye,
    Trash2,
    CheckCircle,
    XCircle,
    Loader2,
    BarChart2,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import axios from "axios";

const FeedbackManager = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSession, setNewSession] = useState({
        title: "",
        startDate: "",
        endDate: "",
        targetSemester: "",
        targetDepartment: "",
    });
    const [results, setResults] = useState(null); // Stores results for a specific session
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);

    // Fetch all sessions
    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:5000/api/admin/feedback/sessions");
            if (res.data.success) {
                setSessions(res.data.sessions);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    // Create Session
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:5000/api/admin/feedback/sessions", newSession);
            setShowCreateModal(false);
            setNewSession({ title: "", startDate: "", endDate: "", targetSemester: "", targetDepartment: "" });
            fetchSessions();
        } catch (error) {
            console.error("Error creating session:", error);
            alert("Failed to create session");
        }
    };

    // Toggle Session Active Status
    const handleToggle = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/feedback/sessions/${id}/toggle`);
            fetchSessions(); // Refresh to reflect changes (others might auto-deactivate)
        } catch (error) {
            console.error("Error toggling session:", error);
        }
    };

    // Delete Session
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete all feedback responses for this session.")) return;
        try {
            await axios.delete(`http://localhost:5000/api/admin/feedback/sessions/${id}`);
            fetchSessions();
        } catch (error) {
            console.error("Error deleting session:", error);
        }
    };

    // View Results
    const handleViewResults = async (sessionId) => {
        try {
            setLoadingResults(true);
            setShowResultsModal(true);
            const res = await axios.get(`http://localhost:5000/api/admin/feedback/results/${sessionId}`);
            if (res.data.success) {
                setResults(res.data.results);
            }
        } catch (error) {
            console.error("Error fetching results:", error);
        } finally {
            setLoadingResults(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Feedback Sessions</h2>
                    <p className="text-gray-500 text-sm">Manage student feedback windows</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Session
                </button>
            </div>

            {/* Sessions List */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No feedback sessions found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {sessions.map((session) => (
                        <div
                            key={session._id}
                            className={`p-4 bg-white rounded-xl border transition-all ${session.isActive ? "border-green-500 shadow-md ring-1 ring-green-100" : "border-gray-200 hover:shadow-sm"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-lg text-gray-800">{session.title}</h3>
                                        {session.isActive ? (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Active
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
                                        </div>
                                        {session.targetSemester && <span>Sem {session.targetSemester}</span>}
                                        {session.targetDepartment && <span>{session.targetDepartment}</span>}
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                                            <MessageSquare className="w-3 h-3" />
                                            {session.responseCount || 0} Responses
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggle(session._id)}
                                        className={`p-2 rounded-lg transition-colors ${session.isActive
                                                ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                                : "bg-green-100 text-green-600 hover:bg-green-200"
                                            }`}
                                        title={session.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {session.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => handleViewResults(session._id)}
                                        className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                                        title="View Results"
                                    >
                                        <BarChart2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(session._id)}
                                        className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Create New Session</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newSession.title}
                                    onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="e.g. End Semester Feedback"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newSession.startDate}
                                        onChange={(e) => setNewSession({ ...newSession, startDate: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newSession.endDate}
                                        onChange={(e) => setNewSession({ ...newSession, endDate: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Semester (Opt)</label>
                                    <input
                                        type="number"
                                        value={newSession.targetSemester}
                                        onChange={(e) => setNewSession({ ...newSession, targetSemester: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                        placeholder="All"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department (Opt)</label>
                                    <input
                                        type="text"
                                        value={newSession.targetDepartment}
                                        onChange={(e) => setNewSession({ ...newSession, targetDepartment: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                        placeholder="All"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Results Modal */}
            {showResultsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-xl">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold">Feedback Results</h3>
                            <button
                                onClick={() => setShowResultsModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <XCircle className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            {loadingResults ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                </div>
                            ) : !results || results.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    No feedback received yet.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {results.map((result, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-xl border shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-lg text-gray-800">{result.teacher.name}</h4>
                                                    <p className="text-sm text-gray-500">{result.teacher.employeeId} • {result.teacher.department}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-blue-600">{result.overallAverage}</div>
                                                    <p className="text-xs text-gray-500">Overall Rating (out of 4)</p>
                                                    <p className="text-xs text-gray-400 mt-1">{result.totalResponses} responses</p>
                                                </div>
                                            </div>

                                            {/* Question Breakdown */}
                                            <div className="space-y-3 mb-6">
                                                {result.questionAverages.map((qa, i) => (
                                                    <div key={i} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600 flex-1">{qa.question}</span>
                                                        <div className="flex items-center gap-3 w-32 justify-end">
                                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-blue-500 rounded-full"
                                                                    style={{ width: `${(qa.average / 4) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="font-medium text-gray-700 w-8 text-right">{qa.average}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Comments */}
                                            {result.comments.length > 0 && (
                                                <div>
                                                    <h5 className="font-semibold text-gray-700 mb-2 text-sm">Student Comments</h5>
                                                    <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                                        {result.comments.map((comment, i) => (
                                                            <p key={i} className="text-sm text-gray-600 italic border-l-2 border-blue-300 pl-2">
                                                                "{comment}"
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackManager;
