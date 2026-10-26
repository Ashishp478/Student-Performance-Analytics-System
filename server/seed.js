
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Department = require('./models/Department');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Subject = require('./models/Subject');

async function seedDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI missing in server/.env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
     console.log("Database used by seed:", mongoose.connection.name);
    // 1. Create or reuse a department
    let department = await Department.findOne({ code: 'CSE' });

    if (!department) {
      department = await Department.create({
        code: 'CSE',
        name: 'Computer Science and Engineering',
        description: 'Computer Science department',
      });
    }

    console.log('Department ready:', department.name);

    // 2. Create demo subjects
    const subjectData = [
      { code: 'CSE101', name: 'Programming Fundamentals', semester: 1 },
      { code: 'CSE102', name: 'Database Management Systems', semester: 2 },
      { code: 'CSE201', name: 'Data Structures and Algorithms', semester: 3 },
      { code: 'CSE301', name: 'Web Development', semester: 4 },
    ];

    const subjects = [];

    for (const item of subjectData) {
      let subject = await Subject.findOne({ code: item.code });

      if (!subject) {
        subject = await Subject.create({
          ...item,
          department: department._id,
          credits: 3,
        });
      }

      subjects.push(subject);
    }

    // 3. Create demo faculty
    let facultyUser = await User.findOne({
      email: 'faculty.demo@college.edu',
    });

    if (!facultyUser) {
      facultyUser = await User.create({
        name: 'Demo Faculty',
        email: 'faculty.demo@college.edu',
        password: 'FacultyDemo@123',
        role: 'faculty',
      });
    }

    let faculty = await Faculty.findOne({
      employeeId: 'EMP001',
    });

    if (!faculty) {
      faculty = await Faculty.create({
        employeeId: 'EMP001',
        user: facultyUser._id,
        name: facultyUser.name,
        email: facultyUser.email,
        department: department._id,
        designation: 'Assistant Professor',
        assignedSubjects: subjects.map(s => s._id),
      });
    }

    // 4. Link subjects to faculty if missing
    for (const subject of subjects) {
      if (!subject.faculty) {
        subject.faculty = faculty._id;
        await subject.save();
      }
    }

    // 5. Create 15 demo students
    const firstNames = [
      'Aarav', 'Ananya', 'Rohan', 'Priya', 'Aditya',
      'Neha', 'Rahul', 'Sneha', 'Arjun', 'Kavya',
      'Vikram', 'Ishita', 'Karan', 'Pooja', 'Aman',
    ];

    for (let i = 0; i < firstNames.length; i++) {
      const number = String(i + 1).padStart(3, '0');
      const email = `student${number}@demo.college.edu`;
      const rollNo = `CSE${number}`;

      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name: firstNames[i],
          email,
          password: 'StudentDemo@123',
          role: 'student',
        });
      }

      const existingStudent = await Student.findOne({ rollNo });

      if (!existingStudent) {
        await Student.create({
          rollNo,
          user: user._id,
          name: firstNames[i],
          email,
          department: department._id,
          semester: (i % 8) + 1,
          section: i % 2 === 0 ? 'A' : 'B',
          enrollmentYear: 2023,
          previousCgpa: Number((6.0 + (i % 5) * 0.5).toFixed(2)),
          cgpa: Number((6.2 + (i % 7) * 0.45).toFixed(2)),
          attendanceRate: 65 + (i % 6) * 6,
          status: 'Active',
          skills: ['Programming', 'Problem Solving'],
          backlogs: i % 4 === 0 ? 1 : 0,
        });
      }
    }

    console.log('Demo seed completed successfully');

    console.log({
      departments: await Department.countDocuments(),
      subjects: await Subject.countDocuments(),
      faculty: await Faculty.countDocuments(),
      students: await Student.countDocuments(),
      users: await User.countDocuments(),
    });
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
