// src/pages/admin/FAQManager.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  HelpCircle,
  Tag,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Filter,
  Download,
  Upload,
  Loader2,
} from "lucide-react";

import { BASE_URL } from "../../utils/api";

const API_URL = `${BASE_URL}/api/admin`;

const FAQManager = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "academic",
    tags: "",
  });

  const [faqs, setFaqs] = useState([]);

  // Fetch FAQs from API
  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`${API_URL}/faqs?${params}`);
      const data = await res.json();

      if (data.success) {
        setFaqs(data.faqs.map(f => ({
          ...f,
          id: f._id,
          createdAt: new Date(f.createdAt).toISOString().split("T")[0],
        })));
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, [selectedCategory]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFAQs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const categories = [
    { value: "all", label: "All Categories", color: "gray" },
    { value: "academic", label: "Academic", color: "blue" },
    { value: "facilities", label: "Facilities", color: "green" },
    { value: "administration", label: "Administration", color: "purple" },
    { value: "technical", label: "Technical", color: "orange" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editMode && editId) {
        // Update existing FAQ
        const res = await fetch(`${API_URL}/faqs/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      } else {
        // Create new FAQ
        const res = await fetch(`${API_URL}/faqs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      }

      await fetchFAQs();
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert("Error saving FAQ: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ question: "", answer: "", category: "academic", tags: "" });
    setEditMode(false);
    setEditId(null);
  };

  const handleEdit = (faq) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      tags: Array.isArray(faq.tags) ? faq.tags.join(", ") : faq.tags,
    });
    setEditId(faq.id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      try {
        const res = await fetch(`${API_URL}/faqs/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        await fetchFAQs();
      } catch (error) {
        alert("Error deleting FAQ: " + error.message);
      }
    }
  };

  // Filter is now done server-side
  const filteredFaqs = faqs;

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
                  FAQ Manager
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage frequently asked questions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add FAQ</span>
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
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <HelpCircle className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{faqs.length}</p>
            <p className="text-blue-100 text-sm">Total FAQs</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <CheckCircle className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {faqs.filter((f) => f.status === "active").length}
            </p>
            <p className="text-green-100 text-sm">Active</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <Tag className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{categories.length - 1}</p>
            <p className="text-purple-100 text-sm">Categories</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">0</p>
            <p className="text-orange-100 text-sm">Pending Review</p>
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${faq.category === "academic"
                          ? "bg-blue-100 text-blue-700"
                          : faq.category === "facilities"
                            ? "bg-green-100 text-green-700"
                            : faq.category === "administration"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-orange-100 text-orange-700"
                        }`}
                    >
                      {faq.category}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {faq.createdAt}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 mb-3">{faq.answer}</p>
                  <div className="flex items-center space-x-2">
                    {faq.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(faq)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No FAQs Found
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
                {editMode ? "Edit FAQ" : "Add New FAQ"}
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
                  Question *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the question"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer *
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the answer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="academic">Academic</option>
                  <option value="facilities">Facilities</option>
                  <option value="administration">Administration</option>
                  <option value="technical">Technical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., exams, results, marks"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  <span className="font-medium">
                    {editMode ? "Update FAQ" : "Create FAQ"}
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

export default FAQManager;
