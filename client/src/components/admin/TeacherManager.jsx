// src/pages/admin/TeacherManager.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  GraduationCap,
  FileSpreadsheet,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Briefcase,
  BookOpen,
  Book,
  ChevronDown,
} from "lucide-react";

const TeacherManager = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // NEW: Subjects for assignment
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    subjectsAssigned: [],
    password: "teacher123",
  });

  const departments = [
    "Computer Science",
    "Information Science",
    "Electronics",
    "Mechanical",
    "Civil",
  ];

  // NEW: Fetch subjects for the current department
  const fetchSubjectsForDepartment = async (dept) => {
    if (!dept || dept === "") return;

    try {
      setSubjectsLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await API.get(
        `/api/admin/subjects?department=${dept}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();

      if (selectedDepartment !== "all")
        params.append("department", selectedDepartment);
      if (searchTerm) params.append("search", searchTerm);

      const response = await API.get(
        `/api/admin/teachers?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTeachers(response.data.teachers);
      setFilteredTeachers(response.data.teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      alert(error.response?.data?.message || "Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await API.get(
        "/api/admin/teachers/stats",
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
    fetchTeachers();
    fetchStats();
  }, [selectedDepartment, searchTerm]);

  // NEW: Watch department changes to fetch relevant subjects
  useEffect(() => {
    if (formData.department) {
      fetchSubjectsForDepartment(formData.department);
    } else {
      setSubjects([]);
    }
  }, [formData.department]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");

      if (editMode) {
        await API.put(
          `/api/admin/teachers/${selectedTeacher._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert("Teacher updated successfully!");
      } else {
        await API.post("/api/admin/teachers", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Teacher added successfully!");
      }

      setShowModal(false);
      resetForm();
      fetchTeachers();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher?"))
      return;

    try {
      const token = localStorage.getItem("adminToken");
      await API.delete(`/api/admin/teachers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Teacher deleted successfully!");
      fetchTeachers();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete teacher");
    }
  };

  // Handle edit
  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      employeeId: teacher.employeeId,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      department: teacher.department,
      subjectsAssigned: teacher.subjectsAssigned || [],
      password: "",
    });
    setEditMode(true);
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      employeeId: "",
      name: "",
      email: "",
      phone: "",
      department: "",
      subjectsAssigned: [],
      password: "teacher123",
    });
    setSelectedSubjectId("");
    setSubjects([]);
    setEditMode(false);
    setSelectedTeacher(null);
  };

  // NEW: Add selected subject to teacher
  const addSubjectToTeacher = () => {
    if (!selectedSubjectId) return;

    const subject = subjects.find((s) => s._id === selectedSubjectId);
    if (!subject) return;

    // Check if already assigned (by subjectCode)
    const alreadyAssigned = formData.subjectsAssigned.some(
      (assigned) => assigned.subjectCode === subject.subjectCode
    );

    if (alreadyAssigned) {
      alert(`${subject.subjectCode} is already assigned to this teacher`);
      return;
    }

    // Add only subjectCode and subjectName to teacher
    setFormData((prev) => ({
      ...prev,
      subjectsAssigned: [
        ...prev.subjectsAssigned,
        {
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
        },
      ],
    }));

    setSelectedSubjectId("");
  };

  // Remove subject from teacher
  const removeSubject = (index) => {
    setFormData((prev) => ({
      ...prev,
      subjectsAssigned: prev.subjectsAssigned.filter((_, i) => i !== index),
    }));
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
      const formDataUpload = new FormData();
      formDataUpload.append("file", uploadFile);

      const response = await API.post(
        "/api/admin/teachers/bulk-upload",
        formDataUpload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadResult(response.data);
      fetchTeachers();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - unchanged */}
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
                  Teacher Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage faculty records and bulk uploads
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
                onClick={fetchTeachers}
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
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Teacher</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and filters - unchanged */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
            <GraduationCap className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{stats?.total || 0}</p>
            <p className="text-green-100 text-sm">Total Teachers</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <Briefcase className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {stats?.byDepartment?.length || 0}
            </p>
            <p className="text-blue-100 text-sm">Departments</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <BookOpen className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {teachers.reduce(
                (sum, t) => sum + (t.subjectsAssigned?.length || 0),
                0
              )}
            </p>
            <p className="text-purple-100 text-sm">Subjects Assigned</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, ID, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Teacher table - unchanged */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <RefreshCw className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading teachers...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Teachers Found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add First Teacher</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTeachers.map((teacher) => (
                    <tr
                      key={teacher._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              {teacher.name.charAt(0)}
                            </span>
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {teacher.employeeId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {teacher.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {teacher.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {teacher.department}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {teacher.subjectsAssigned?.length || 0} subject(s)
                        </div>
                        {teacher.subjectsAssigned?.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {teacher.subjectsAssigned
                              .slice(0, 2)
                              .map((s) => s.subjectCode)
                              .join(", ")}
                            {teacher.subjectsAssigned.length > 2 && "..."}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(teacher)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(teacher._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* NEW: Updated Add/Edit Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editMode ? "Edit Teacher" : "Add New Teacher"}
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
              {/* Basic Info - unchanged */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., EMP001"
                    required
                    disabled={editMode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="teacher@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="10-digit number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {editMode && "(leave blank to keep current)"}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={
                      editMode
                        ? "Leave blank to keep current"
                        : "Default: teacher123"
                    }
                  />
                </div>
              </div>

              {/* NEW: Subjects Assigned - Dropdown from existing subjects */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Assign Subjects
                  {formData.department && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({subjects.length} available for {formData.department})
                    </span>
                  )}
                </h3>

                {/* NEW: Select Subject Form */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Subject to Assign
                      </label>
                      <div className="relative">
                        <select
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
                          disabled={subjectsLoading || !formData.department}
                        >
                          <option value="">
                            {subjectsLoading
                              ? "Loading subjects..."
                              : !formData.department
                              ? "Select department first"
                              : "Choose a subject..."}
                          </option>
                          {subjects.map((subject) => (
                            <option key={subject._id} value={subject._id}>
                              {subject.subjectCode} - {subject.subjectName}
                              (Sem {subject.semester}, {subject.credits}cr,{" "}
                              {subject.subjectType === "integrated"
                                ? "Lab"
                                : "Theory"}
                              )
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addSubjectToTeacher}
                      disabled={!selectedSubjectId || subjectsLoading}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Add Selected Subject</span>
                    </button>
                  </div>
                </div>

                {/* Assigned Subjects List */}
                {formData.subjectsAssigned.length > 0 ? (
                  <div className="space-y-2">
                    {formData.subjectsAssigned.map((subject, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Book className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="block font-semibold text-gray-900 text-sm">
                              {subject.subjectCode}
                            </span>
                            <span className="block text-gray-600 text-xs">
                              {subject.subjectName}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSubject(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg font-medium mb-2">
                      No subjects assigned yet
                    </p>
                    <p className="text-sm text-gray-400">
                      Select subjects from the dropdown above
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  <span className="font-medium">
                    {editMode ? "Update Teacher" : "Add Teacher"}
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

      {/* Excel Upload Modal - unchanged */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Bulk Upload Teachers</h2>
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>Upload Instructions</span>
                </h3>
                <ul className="text-sm text-green-800 space-y-1 ml-7">
                  <li>• Upload an Excel file (.xlsx or .xls)</li>
                  <li>
                    • Required columns: employeeId, name, email, phone,
                    department
                  </li>
                  <li>• Optional: subjectsAssigned (JSON format), password</li>
                  <li>• Default password is "teacher123" if not provided</li>
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:border-green-500 hover:border-green-400 transition-colors"
                />
                {uploadFile && (
                  <p className="mt-2 text-sm text-gray-600 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    {uploadFile.name}
                  </p>
                )}
              </div>
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
                    <span>Upload Result</span>
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
                      ✓ Successfully inserted: {uploadResult.inserted} teachers
                    </p>
                  )}
                  {uploadResult.failed > 0 && (
                    <p className="text-sm text-red-800 mt-1">
                      ✗ Failed: {uploadResult.failed} teachers
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={handleFileUpload}
                disabled={!uploadFile || uploading}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">Upload Teachers</span>
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

export default TeacherManager;
