// src/pages/admin/SubjectManager.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  BookOpen,
  FileSpreadsheet,
  Download,
  Book,
  ArrowLeft,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Award,
  Hash,
  Layers,
  Beaker,
} from "lucide-react";

const SubjectManager = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    subjectCode: "",
    subjectName: "",
    subjectType: "non-integrated",
    department: "",
    semester: "",
    credits: "",
  });

  const departments = [
    "Computer Science",
    "Information Science",
    "Electronics",
    "Mechanical",
    "Civil",
  ];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const subjectTypes = ["integrated", "non-integrated"];

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();

      if (selectedDepartment !== "all")
        params.append("department", selectedDepartment);
      if (selectedSemester !== "all")
        params.append("semester", selectedSemester);
      if (selectedType !== "all") params.append("subjectType", selectedType);
      if (searchTerm) params.append("search", searchTerm);

      const response = await axios.get(
        `http://localhost:5000/api/admin/subjects?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSubjects(response.data.subjects);
      setFilteredSubjects(response.data.subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      alert(error.response?.data?.message || "Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5000/api/admin/subjects/stats",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchStats();
  }, [selectedDepartment, selectedSemester, selectedType, searchTerm]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");

      if (editMode) {
        await axios.put(
          `http://localhost:5000/api/admin/subjects/${selectedSubject._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert("Subject updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/admin/subjects", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Subject added successfully!");
      }

      setShowModal(false);
      resetForm();
      fetchSubjects();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?"))
      return;

    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`http://localhost:5000/api/admin/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Subject deleted successfully!");
      fetchSubjects();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete subject");
    }
  };

  // Handle edit
  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      subjectType: subject.subjectType,
      department: subject.department || "",
      semester: subject.semester || "",
      credits: subject.credits || "",
    });
    setEditMode(true);
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      subjectCode: "",
      subjectName: "",
      subjectType: "non-integrated",
      department: "",
      semester: "",
      credits: "",
    });
    setEditMode(false);
    setSelectedSubject(null);
  };

  // Handle Excel upload
  const handleFileUpload = async () => {
    if (!uploadFile) {
      alert("Please select a file");
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await axios.post(
        "http://localhost:5000/api/admin/subjects/bulk-upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadResult(response.data);
      fetchSubjects();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

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
                  Subject Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage course subjects and bulk uploads
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Upload</span>
              </button>
              <button
                onClick={fetchSubjects}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Subject</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <BookOpen className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{stats?.total || 0}</p>
            <p className="text-orange-100 text-sm">Total Subjects</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <Layers className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {stats?.byDepartment?.length || 0}
            </p>
            <p className="text-blue-100 text-sm">Departments</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
            <Beaker className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {stats?.byType?.find((t) => t._id === "integrated")?.count || 0}
            </p>
            <p className="text-green-100 text-sm">With Lab</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <Award className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {subjects.reduce((sum, s) => sum + (s.credits || 0), 0)}
            </p>
            <p className="text-purple-100 text-sm">Total Credits</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="all">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="integrated">With Lab</option>
              <option value="non-integrated">Without Lab</option>
            </select>
          </div>
        </div>

        {/* Subject List */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading subjects...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Subjects Found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add First Subject</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <div
                key={subject._id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        subject.subjectType === "integrated"
                          ? "bg-green-100"
                          : "bg-blue-100"
                      }`}
                    >
                      {subject.subjectType === "integrated" ? (
                        <Beaker
                          className={`w-6 h-6 ${
                            subject.subjectType === "integrated"
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        />
                      ) : (
                        <Book className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {subject.subjectCode}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          subject.subjectType === "integrated"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {subject.subjectType === "integrated"
                          ? "With Lab"
                          : "Theory"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(subject)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subject._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="text-gray-800 font-semibold mb-4">
                  {subject.subjectName}
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium text-gray-800">
                      {subject.department}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Semester:</span>
                    <span className="font-medium text-gray-800">
                      Sem {subject.semester}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Credits:</span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      {subject.credits} Credits
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editMode ? "Edit Subject" : "Add New Subject"}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    value={formData.subjectCode}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectCode: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., CS301"
                    required
                    disabled={editMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Type *
                  </label>
                  <select
                    value={formData.subjectType}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectType: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="non-integrated">
                      Theory (Non-Integrated)
                    </option>
                    <option value="integrated">With Lab (Integrated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={formData.subjectName}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectName: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter subject name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester *
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({ ...formData, semester: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select</option>
                    {semesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits *
                  </label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) =>
                      setFormData({ ...formData, credits: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., 4"
                    min="1"
                    max="10"
                    required
                  />
                </div>
              </div>

              {/* Info box about subject type */}
              <div
                className={`rounded-lg p-4 ${
                  formData.subjectType === "integrated"
                    ? "bg-green-50 border border-green-200"
                    : "bg-blue-50 border border-blue-200"
                }`}
              >
                <h3
                  className={`font-semibold mb-2 flex items-center ${
                    formData.subjectType === "integrated"
                      ? "text-green-900"
                      : "text-blue-900"
                  }`}
                >
                  {formData.subjectType === "integrated" ? (
                    <Beaker className="w-5 h-5 mr-2" />
                  ) : (
                    <Book className="w-5 h-5 mr-2" />
                  )}
                  {formData.subjectType === "integrated"
                    ? "Integrated Subject (With Lab)"
                    : "Non-Integrated Subject (Theory)"}
                </h3>
                <p
                  className={`text-sm ${
                    formData.subjectType === "integrated"
                      ? "text-green-800"
                      : "text-blue-800"
                  }`}
                >
                  {formData.subjectType === "integrated"
                    ? "CIE: 50 marks (CIE1: 10, CIE2: 10, AAT: 10, Lab: 20) | SEE: 100 marks"
                    : "CIE: 50 marks (CIE1: 20, CIE2: 20, AAT: 10) | SEE: 100 marks"}
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  <span className="font-medium">
                    {editMode ? "Update Subject" : "Add Subject"}
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

      {/* Excel Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Bulk Upload Subjects</h2>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadResult(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-2 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Upload Instructions
                </h3>
                <ul className="text-sm text-orange-800 space-y-1 ml-7">
                  <li>• Upload an Excel file (.xlsx or .xls)</li>
                  <li>
                    • Required columns: subjectCode, subjectName, subjectType,
                    department, semester, credits
                  </li>
                  <li>
                    • subjectType must be either "integrated" or
                    "non-integrated"
                  </li>
                  <li>
                    • semester must be between 1-8, credits typically 1-10
                  </li>
                </ul>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 hover:border-orange-400 transition-colors"
                />
                {uploadFile && (
                  <p className="mt-2 text-sm text-gray-600 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    {uploadFile.name}
                  </p>
                )}
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div
                  className={`rounded-lg p-4 ${
                    uploadResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <h3
                    className={`font-semibold mb-2 flex items-center ${
                      uploadResult.success ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {uploadResult.success ? (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 mr-2" />
                    )}
                    Upload Result
                  </h3>
                  <p
                    className={`text-sm ${
                      uploadResult.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {uploadResult.message}
                  </p>
                  {uploadResult.inserted > 0 && (
                    <p className="text-sm text-green-800 mt-1">
                      ✓ Successfully inserted: {uploadResult.inserted} subjects
                    </p>
                  )}
                  {uploadResult.failed > 0 && (
                    <p className="text-sm text-red-800 mt-1">
                      ✗ Failed: {uploadResult.failed} subjects
                    </p>
                  )}
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleFileUpload}
                disabled={!uploadFile || uploading}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">Upload Subjects</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManager;
