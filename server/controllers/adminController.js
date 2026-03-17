// controllers/adminController.js (or controllers/admin/studentController.js)
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const xlsx = require("xlsx");
const Subject = require("../models/Subject");
// ==================== STUDENT MANAGEMENT ====================

// Get all students with filters
exports.getAllStudents = async (req, res) => {
  try {
    const { department, course, semester, search } = req.query;
    let query = {};

    if (department && department !== "all") query.department = department;
    if (course && course !== "all") query.course = course;
    if (semester && semester !== "all") query.semester = parseInt(semester);

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { usn: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const students = await Student.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: students.length, students });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Get single student
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select(
      "-passwordHash"
    );
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, student });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Add single student
exports.addStudent = async (req, res) => {
  try {
    const {
      usn,
      name,
      email,
      phone,
      course,
      department,
      semester,
      section,
      dob,
      address,
      password,
    } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [{ usn }, { email }],
    });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student with this USN or email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password || "student123", 10);

    const student = new Student({
      usn,
      name,
      email,
      phone,
      course,
      department,
      semester,
      section,
      dob,
      address,
      passwordHash,
    });

    await student.save();
    res
      .status(201)
      .json({ success: true, message: "Student added successfully", student });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    res.json({
      success: true,
      message: "Student updated successfully",
      student,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Bulk upload students via Excel
exports.bulkUploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload an Excel file" });
    }

    // Read Excel file
    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Excel file is empty" });
    }

    // Validate required columns
    const requiredColumns = [
      "usn",
      "name",
      "email",
      "phone",
      "course",
      "department",
      "semester",
    ];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(", ")}`,
      });
    }

    const studentsToInsert = [];
    const errors = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Check for duplicates
        const existing = await Student.findOne({
          $or: [{ usn: row.usn }, { email: row.email }],
        });
        if (existing) {
          errors.push({
            row: i + 2,
            usn: row.usn,
            error: "Duplicate USN or email",
          });
          continue;
        }

        // Hash default password
        const passwordHash = await bcrypt.hash(
          row.password || "student123",
          10
        );

        studentsToInsert.push({
          usn: row.usn,
          name: row.name,
          email: row.email,
          phone: row.phone,
          course: row.course,
          department: row.department,
          semester: parseInt(row.semester),
          section: row.section || "",
          dob: row.dob ? new Date(row.dob) : undefined,
          address: row.address || "",
          passwordHash,
        });
      } catch (error) {
        errors.push({ row: i + 2, usn: row.usn, error: error.message });
      }
    }

    // Bulk insert
    let insertedCount = 0;
    if (studentsToInsert.length > 0) {
      const result = await Student.insertMany(studentsToInsert, {
        ordered: false,
      });
      insertedCount = result.length;
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${insertedCount} students`,
      inserted: insertedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Get statistics
exports.getStudentStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const byDepartment = await Student.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);
    const byCourse = await Student.aggregate([
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]);
    const bySemester = await Student.aggregate([
      { $group: { _id: "$semester", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        total: totalStudents,
        byDepartment,
        byCourse,
        bySemester,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ==================== TEACHER MANAGEMENT ====================

// Get all teachers with filters
exports.getAllTeachers = async (req, res) => {
  try {
    const { department, search } = req.query;
    let query = {};

    if (department && department !== "all") query.department = department;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const teachers = await Teacher.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: teachers.length, teachers });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Get single teacher
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select(
      "-passwordHash"
    );
    if (!teacher) {
      return res
        .status(404)
        .json({ success: false, message: "Teacher not found" });
    }
    res.json({ success: true, teacher });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Add single teacher
exports.addTeacher = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      phone,
      department,
      subjectsAssigned,
      password,
    } = req.body;

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({
      $or: [{ employeeId }, { email }],
    });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: "Teacher with this ID or email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password || "teacher123", 10);

    const teacher = new Teacher({
      employeeId,
      name,
      email,
      phone,
      department,
      subjectsAssigned: subjectsAssigned || [],
      passwordHash,
    });

    await teacher.save();
    res
      .status(201)
      .json({ success: true, message: "Teacher added successfully", teacher });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const teacher = await Teacher.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!teacher) {
      return res
        .status(404)
        .json({ success: false, message: "Teacher not found" });
    }

    res.json({
      success: true,
      message: "Teacher updated successfully",
      teacher,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Delete teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res
        .status(404)
        .json({ success: false, message: "Teacher not found" });
    }
    res.json({ success: true, message: "Teacher deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Bulk upload teachers via Excel
exports.bulkUploadTeachers = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload an Excel file" });
    }

    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Excel file is empty" });
    }

    // Validate required columns
    const requiredColumns = [
      "employeeId",
      "name",
      "email",
      "phone",
      "department",
    ];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(", ")}`,
      });
    }

    const teachersToInsert = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const existing = await Teacher.findOne({
          $or: [{ employeeId: row.employeeId }, { email: row.email }],
        });
        if (existing) {
          errors.push({
            row: i + 2,
            employeeId: row.employeeId,
            error: "Duplicate ID or email",
          });
          continue;
        }

        const passwordHash = await bcrypt.hash(
          row.password || "teacher123",
          10
        );

        // Parse subjects if provided (expecting JSON string or empty)
        let subjectsAssigned = [];
        if (row.subjectsAssigned) {
          try {
            subjectsAssigned = JSON.parse(row.subjectsAssigned);
          } catch (e) {
            subjectsAssigned = [];
          }
        }

        teachersToInsert.push({
          employeeId: row.employeeId,
          name: row.name,
          email: row.email,
          phone: row.phone,
          department: row.department,
          subjectsAssigned,
          passwordHash,
        });
      } catch (error) {
        errors.push({
          row: i + 2,
          employeeId: row.employeeId,
          error: error.message,
        });
      }
    }

    let insertedCount = 0;
    if (teachersToInsert.length > 0) {
      const result = await Teacher.insertMany(teachersToInsert, {
        ordered: false,
      });
      insertedCount = result.length;
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${insertedCount} teachers`,
      inserted: insertedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Get teacher statistics
exports.getTeacherStats = async (req, res) => {
  try {
    const totalTeachers = await Teacher.countDocuments();
    const byDepartment = await Teacher.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        total: totalTeachers,
        byDepartment,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ==================== SUBJECT MANAGEMENT ====================

// Get all subjects with filters
exports.getAllSubjects = async (req, res) => {
  try {
    const { department, semester, subjectType, search } = req.query;
    let query = {};

    if (department && department !== "all") query.department = department;
    if (semester && semester !== "all") query.semester = parseInt(semester);
    if (subjectType && subjectType !== "all") query.subjectType = subjectType;

    if (search) {
      query.$or = [
        { subjectName: { $regex: search, $options: "i" } },
        { subjectCode: { $regex: search, $options: "i" } },
      ];
    }

    const subjects = await Subject.find(query).sort({ subjectCode: 1 });

    res.json({ success: true, count: subjects.length, subjects });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Get single subject
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }
    res.json({ success: true, subject });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Add single subject
exports.addSubject = async (req, res) => {
  try {
    const {
      subjectCode,
      subjectName,
      subjectType,
      department,
      semester,
      credits,
    } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ subjectCode });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject with this code already exists",
      });
    }

    const subject = new Subject({
      subjectCode,
      subjectName,
      subjectType,
      department,
      semester,
      credits,
    });

    await subject.save();
    res
      .status(201)
      .json({ success: true, message: "Subject added successfully", subject });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Update subject
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }

    res.json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Delete subject
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }
    res.json({ success: true, message: "Subject deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Bulk upload subjects via Excel
exports.bulkUploadSubjects = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload an Excel file" });
    }

    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Excel file is empty" });
    }

    // Validate required columns
    const requiredColumns = [
      "subjectCode",
      "subjectName",
      "subjectType",
      "department",
      "semester",
      "credits",
    ];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(", ")}`,
      });
    }

    const subjectsToInsert = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const existing = await Subject.findOne({
          subjectCode: row.subjectCode,
        });
        if (existing) {
          errors.push({
            row: i + 2,
            subjectCode: row.subjectCode,
            error: "Duplicate subject code",
          });
          continue;
        }

        // Validate subject type
        if (!["integrated", "non-integrated"].includes(row.subjectType)) {
          errors.push({
            row: i + 2,
            subjectCode: row.subjectCode,
            error: "Invalid subject type",
          });
          continue;
        }

        subjectsToInsert.push({
          subjectCode: row.subjectCode,
          subjectName: row.subjectName,
          subjectType: row.subjectType,
          department: row.department,
          semester: parseInt(row.semester),
          credits: parseInt(row.credits),
        });
      } catch (error) {
        errors.push({
          row: i + 2,
          subjectCode: row.subjectCode,
          error: error.message,
        });
      }
    }

    let insertedCount = 0;
    if (subjectsToInsert.length > 0) {
      const result = await Subject.insertMany(subjectsToInsert, {
        ordered: false,
      });
      insertedCount = result.length;
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${insertedCount} subjects`,
      inserted: insertedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Get subject statistics
exports.getSubjectStats = async (req, res) => {
  try {
    const totalSubjects = await Subject.countDocuments();
    const byDepartment = await Subject.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);
    const bySemester = await Subject.aggregate([
      { $group: { _id: "$semester", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const byType = await Subject.aggregate([
      { $group: { _id: "$subjectType", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        total: totalSubjects,
        byDepartment,
        bySemester,
        byType,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ==================== DASHBOARD STATS ====================

// Get dashboard statistics (all counts)
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalSubjects] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Subject.countDocuments(),
    ]);

    // Get unique courses from students
    const courses = await Student.distinct("course");
    const totalCourses = courses.length;

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalSubjects,
        totalCourses,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
