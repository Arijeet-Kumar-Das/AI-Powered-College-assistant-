// src/pages/admin/NoticeManager.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  Bell,
  Calendar,
  Users,
  Eye,
  Pin,
  Archive,
  ArrowLeft,
  Filter,
  Send,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Upload,
  Star,
  Loader2,
} from "lucide-react";

import { BASE_URL } from "../../utils/api";

const API_URL = `${BASE_URL}/api/admin`;

const NoticeManager = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal",
    targetAudience: "all",
    expiryDate: "",
    isPinned: false,
  });

  const [notices, setNotices] = useState([]);

  // Fetch notices from API
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedPriority !== "all") params.append("priority", selectedPriority);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`${API_URL}/notices?${params}`);
      const data = await res.json();

      if (data.success) {
        setNotices(data.notices.map(n => ({
          ...n,
          id: n._id,
          createdAt: new Date(n.createdAt).toISOString().split("T")[0],
          expiryDate: n.expiryDate ? new Date(n.expiryDate).toISOString().split("T")[0] : "",
        })));
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [selectedPriority]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotices();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const priorities = [
    { value: "all", label: "All Priorities", color: "gray" },
    { value: "urgent", label: "Urgent", color: "red" },
    { value: "high", label: "High", color: "orange" },
    { value: "normal", label: "Normal", color: "blue" },
  ];

  const audiences = [
    { value: "all", label: "Everyone" },
    { value: "students", label: "Students Only" },
    { value: "faculty", label: "Faculty Only" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editMode && editId) {
        // Update existing notice
        const res = await fetch(`${API_URL}/notices/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      } else {
        // Create new notice
        const res = await fetch(`${API_URL}/notices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      }

      await fetchNotices();
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert("Error saving notice: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "normal",
      targetAudience: "all",
      expiryDate: "",
      isPinned: false,
    });
    setEditMode(false);
    setEditId(null);
  };

  const handleEdit = (notice) => {
    setFormData({
      title: notice.title,
      description: notice.description,
      priority: notice.priority,
      targetAudience: notice.targetAudience,
      expiryDate: notice.expiryDate,
      isPinned: notice.isPinned,
    });
    setEditId(notice.id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        const res = await fetch(`${API_URL}/notices/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        await fetchNotices();
      } catch (error) {
        alert("Error deleting notice: " + error.message);
      }
    }
  };

  const togglePin = async (id) => {
    try {
      const res = await fetch(`${API_URL}/notices/${id}/pin`, { method: "PATCH" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await fetchNotices();
    } catch (error) {
      alert("Error toggling pin: " + error.message);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "normal":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-gradient-to-r from-red-500 to-red-600";
      case "high":
        return "bg-gradient-to-r from-orange-500 to-orange-600";
      case "normal":
        return "bg-gradient-to-r from-blue-500 to-blue-600";
      default:
        return "bg-gray-500";
    }
  };

  const filteredNotices = notices
    .filter((notice) => {
      const matchesSearch =
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority =
        selectedPriority === "all" || notice.priority === selectedPriority;
      return matchesSearch && matchesPriority;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Notice Manager
                </h1>
                <p className="text-gray-600 mt-1">
                  Create and manage campus announcements
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2">
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create Notice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
            <Bell className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{notices.length}</p>
            <p className="text-green-100 text-sm">Total Notices</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <Eye className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {notices.reduce((sum, n) => sum + n.views, 0)}
            </p>
            <p className="text-blue-100 text-sm">Total Views</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <Pin className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {notices.filter((n) => n.isPinned).length}
            </p>
            <p className="text-purple-100 text-sm">Pinned</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {notices.filter((n) => n.priority === "urgent").length}
            </p>
            <p className="text-orange-100 text-sm">Urgent</p>
          </div>
        </div>

        {/* Notice List */}
        <div className="space-y-4">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${notice.isPinned
                ? "border-yellow-300 bg-yellow-50/30"
                : "border-gray-200"
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {notice.isPinned && (
                      <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Pinned</span>
                      </div>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                        notice.priority
                      )}`}
                    >
                      {notice.priority.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      {
                        audiences.find((a) => a.value === notice.targetAudience)
                          ?.label
                      }
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                    {notice.title}
                  </h3>

                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {notice.description}
                  </p>

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Posted: {notice.createdAt}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Expires: {notice.expiryDate}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{notice.views} views</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => togglePin(notice.id)}
                      className={`p-2 rounded-lg transition-colors ${notice.isPinned
                        ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
                        : "text-gray-400 hover:bg-gray-100"
                        }`}
                      title={notice.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(notice)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 flex items-center space-x-2 text-sm shadow-md">
                    <Send className="w-4 h-4" />
                    <span>Resend</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotices.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Notices Found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editMode ? "Edit Notice" : "Create New Notice"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notice Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter notice title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter detailed description"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience *
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetAudience: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {audiences.map((aud) => (
                      <option key={aud.value} value={aud.value}>
                        {aud.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) =>
                    setFormData({ ...formData, isPinned: e.target.checked })
                  }
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label
                  htmlFor="isPinned"
                  className="ml-2 text-sm text-gray-700"
                >
                  Pin this notice to the top
                </label>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  <span className="font-medium">
                    {editMode ? "Update Notice" : "Publish Notice"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeManager;
