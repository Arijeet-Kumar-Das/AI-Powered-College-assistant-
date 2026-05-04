// src/pages/admin/StudentManager.jsx
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
  Users,
  GraduationCap,
  FileSpreadsheet,
  Download,
  ArrowLeft,
  Filter,
  Eye,
  Mail,
  Phone,
  Calendar,
  Book,
  Hash,
  MapPin,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  UserPlus,
  FileDown,
} from "lucide-react";

const StudentManager = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");

  // Upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    usn: "",
    name: "",
    email: "",
    phone: "",
    course: "",
    department: "",
    semester: "",
    section: "",
    dob: "",
    address: "",
    password: "student123",
  });

  const departments = [
    "Computer Science",
    "Information Science",
    "Electronics",
    "Mechanical",
    "Civil",
  ];
  const courses = ["B.Tech", "M.Tech", "BCA", "MCA"];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();

      if (selectedDepartment !== "all")
        params.append("department", selectedDepartment);
      if (selectedCourse !== "all") params.append("course", selectedCourse);
      if (selectedSemester !== "all")
        params.append("semester", selectedSemester);
      if (searchTerm) params.append("search", searchTerm);

      const response = await API.get(
        `/api/admin/students?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStudents(response.data.students);
      setFilteredStudents(response.data.students);
    } catch (error) {
      console.error("Error fetching students:", error);
      alert(error.response?.data?.message || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await API.get(
        "/api/admin/students/stats",
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
    fetchStudents();
    fetchStats();
  }, [selectedDepartment, selectedCourse, selectedSemester, searchTerm]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");

      if (editMode) {
        await API.put(
          `/api/admin/students/${selectedStudent._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert("Student updated successfully!");
      } else {
        await API.post("/api/admin/students", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Student added successfully!");
      }

      setShowModal(false);
      resetForm();
      fetchStudents();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;

    try {
      const token = localStorage.getItem("adminToken");
      await API.delete(`/api/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Student deleted successfully!");
      fetchStudents();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete student");
    }
  };

  // Handle edit
  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      usn: student.usn,
      name: student.name,
      email: student.email,
      phone: student.phone,
      course: student.course,
      department: student.department,
      semester: student.semester,
      section: student.section || "",
      dob: student.dob ? student.dob.split("T")[0] : "",
      address: student.address || "",
      password: "",
    });
    setEditMode(true);
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      usn: "",
      name: "",
      email: "",
      phone: "",
      course: "",
      department: "",
      semester: "",
      section: "",
      dob: "",
      address: "",
      password: "student123",
    });
    setEditMode(false);
    setSelectedStudent(null);
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

      const response = await API.post(
        "/api/admin/students/bulk-upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadResult(response.data);
      fetchStudents();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Download sample Excel
  const downloadSampleExcel = () => {
    const link = document.createElement("a");
    link.href = "/sample_students.xlsx"; // You'll need to create this file
    link.download = "sample_students.xlsx";
    link.click();
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
                  Student Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage student records and bulk uploads
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
                onClick={fetchStudents}
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
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Student</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <Users className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{stats?.total || 0}</p>
            <p className="text-blue-100 text-sm">Total Students</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
            <GraduationCap className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {stats?.byDepartment?.length || 0}
            </p>
            <p className="text-green-100 text-sm">Departments</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <Book className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {stats?.byCourse?.length || 0}
            </p>
            <p className="text-purple-100 text-sm">Courses</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <Hash className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {stats?.bySemester?.length || 0}
            </p>
            <p className="text-orange-100 text-sm">Semesters</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, USN, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student List */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Students Found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add First Student</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      USN
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {student.usn}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {student.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.course}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Sem {student.semester}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student._id)}
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

      {/* Add/Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editMode ? "Edit Student" : "Add New Student"}
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
                    USN *
                  </label>
                  <input
                    type="text"
                    value={formData.usn}
                    onChange={(e) =>
                      setFormData({ ...formData, usn: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1BM21CS001"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="student@example.com"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    Course *
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) =>
                      setFormData({ ...formData, course: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) =>
                      setFormData({ ...formData, dob: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      editMode
                        ? "Leave blank to keep current"
                        : "Default: student123"
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  <span className="font-medium">
                    {editMode ? "Update Student" : "Add Student"}
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
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Bulk Upload Students</h2>
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Upload Instructions
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 ml-7">
                  <li>• Upload an Excel file (.xlsx or .xls)</li>
                  <li>
                    • Required columns: usn, name, email, phone, course,
                    department, semester
                  </li>
                  <li>• Optional columns: section, dob, address, password</li>
                  <li>• Default password is "student123" if not provided</li>
                </ul>
              </div>

              {/* Download Sample */}
              <button
                onClick={downloadSampleExcel}
                className="w-full px-4 py-3 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors flex items-center justify-center space-x-2 border border-green-200"
              >
                <Download className="w-5 h-5" />
                <span className="font-medium">
                  Download Sample Excel Template
                </span>
              </button>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 hover:border-purple-400 transition-colors"
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
                      ✓ Successfully inserted: {uploadResult.inserted} students
                    </p>
                  )}
                  {uploadResult.failed > 0 && (
                    <p className="text-sm text-red-800 mt-1">
                      ✗ Failed: {uploadResult.failed} students
                    </p>
                  )}
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto">
                      <p className="text-sm font-medium text-red-900 mb-1">
                        Errors:
                      </p>
                      {uploadResult.errors.map((err, idx) => (
                        <p key={idx} className="text-xs text-red-700">
                          Row {err.row}: {err.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleFileUpload}
                disabled={!uploadFile || uploading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">Upload Students</span>
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

export default StudentManager;
