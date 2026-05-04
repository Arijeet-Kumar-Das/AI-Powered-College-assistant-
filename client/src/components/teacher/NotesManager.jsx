// src/components/teacher/NotesManager.jsx
// Teacher component for uploading and managing notes

import React, { useState, useEffect, useRef } from "react";
import {
    Upload,
    FileText,
    Trash2,
    Download,
    Loader2,
    AlertCircle,
    CheckCircle,
    X,
} from "lucide-react";
import { BASE_URL } from "../../utils/api";

const NotesManager = ({ subjects = [] }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        subjectCode: "",
    });
    const [selectedFile, setSelectedFile] = useState(null);

    const token = localStorage.getItem("teacherToken");

    // Fetch teacher's notes
    const fetchNotes = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BASE_URL}/api/teacher/notes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setNotes(data.notes);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== "application/pdf") {
                setMessage({ type: "error", text: "Only PDF files are allowed" });
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setMessage({ type: "error", text: "File size must be less than 10MB" });
                return;
            }
            setSelectedFile(file);
            setMessage({ type: "", text: "" });
        }
    };

    // Upload note
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.subjectCode || !selectedFile) {
            setMessage({ type: "error", text: "Please fill all required fields and select a file" });
            return;
        }

        setUploading(true);
        setMessage({ type: "", text: "" });

        try {
            const uploadData = new FormData();
            uploadData.append("title", formData.title);
            uploadData.append("description", formData.description);
            uploadData.append("subjectCode", formData.subjectCode);
            uploadData.append("file", selectedFile);

            const res = await fetch(`${BASE_URL}/api/teacher/notes/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: uploadData,
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: "Note uploaded successfully!" });
                setFormData({ title: "", description: "", subjectCode: "" });
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                fetchNotes();
            } else {
                setMessage({ type: "error", text: data.message || "Upload failed" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Error uploading note" });
        } finally {
            setUploading(false);
        }
    };

    // Delete note
    const handleDelete = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;

        try {
            const res = await fetch(`${BASE_URL}/api/teacher/notes/${noteId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: "Note deleted successfully" });
                fetchNotes();
            } else {
                setMessage({ type: "error", text: data.message || "Delete failed" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Error deleting note" });
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    return (
        <div className="space-y-6">
            {/* Upload Form */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Notes
                </h3>

                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Week 1 - Introduction"
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Subject *
                            </label>
                            <select
                                value={formData.subjectCode}
                                onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="" className="bg-slate-800">Select Subject</option>
                                {subjects.map((s) => (
                                    <option key={s.subjectCode} value={s.subjectCode} className="bg-slate-800">
                                        {s.subjectCode} - {s.subjectName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the notes..."
                            rows={2}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            PDF File * (Max 10MB)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id="pdf-upload"
                            />
                            <label
                                htmlFor="pdf-upload"
                                className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white cursor-pointer hover:bg-white/20 transition-colors"
                            >
                                <FileText className="w-5 h-5" />
                                {selectedFile ? selectedFile.name : "Choose PDF file"}
                            </label>
                            {selectedFile && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {message.text && (
                        <div
                            className={`flex items-center gap-2 p-3 rounded-xl ${message.type === "success"
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-red-500/20 text-red-300"
                                }`}
                        >
                            {message.type === "success" ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <AlertCircle className="w-5 h-5" />
                            )}
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Upload Note
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Notes List */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Your Uploaded Notes ({notes.length})
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-8 text-white/50">
                        No notes uploaded yet. Upload your first note above!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notes.map((note) => (
                            <div
                                key={note.id}
                                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-white font-medium truncate">{note.title}</p>
                                        <p className="text-purple-300 text-sm">
                                            {note.subjectCode} • {formatFileSize(note.fileSize)} • {note.downloads} downloads
                                        </p>
                                        <p className="text-white/50 text-xs mt-1">
                                            Uploaded {new Date(note.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                                        Sem {note.semester}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesManager;
