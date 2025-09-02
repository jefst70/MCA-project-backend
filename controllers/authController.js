import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Teacher from '../models/Teacher.js';
import Admin from '../models/Admin.js';
import Batch from '../models/Batch.js';
import generateToken from '../utils/generateToken.js';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
/*const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};*/

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });

export const signup = async (req, res) => {
  const { role } = req.params;
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    let user;
    const profilePicture = req.file ? req.file.path : '';

    if (role === 'student') {
      const { batch } = req.body;
      if (!batch || batch.length !== 24) {
        return res.status(400).json({ message: 'Invalid or missing batch ID' });
      }

      const batchId = new mongoose.Types.ObjectId(batch);
      user = await Student.create({
        name,
        email,
        password: hashedPassword,
        batch: batchId,
        profilePicture,
      });
    } else if (role === 'parent') {
      const { selectedStudent } = req.body;
      user = await Parent.create({
        name,
        email,
        password: hashedPassword,
        child: selectedStudent,
        profilePicture,
      });
    } else if (role === 'teacher') {
      const { isPlacementOfficer } = req.body;
      user = await Teacher.create({
        name,
        email,
        password: hashedPassword,
        isPlacementOfficer,
        profilePicture,
      });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    res.status(201).json({ message: 'Signup successful', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signup failed' });
  }
};




export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Please provide email, password, and role' });
    }

    let userModel;
    if (role === 'student') userModel = Student;
    else if (role === 'teacher') userModel = Teacher;
    else if (role === 'parent') userModel = Parent;
    else if (role === 'admin') userModel = Admin;
    else return res.status(400).json({ message: 'Invalid role' });

    const user = await userModel.findOne({ email });  
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (role !== 'admin' && user.approved !== true) {
  return res.status(403).json({ message: 'User not approved by admin yet' });
}


    const token = generateToken(user._id, role);
    console.log("Generated Token:", token);

    // Check if token generation failed
    if (!token) {
      return res.status(500).json({ message: 'Token generation failed' });
    }

    // Success response
    res.status(200).json({
      token,
      userId: user._id,
      role,
      name: user.name,
      email: user.email,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getApprovedStudents = async (req, res) => {
  try {
    // Step 1: Get the latest batch based on isLatest: true
    const latestBatch = await Batch.findOne({ isLatest: true });

    if (!latestBatch) {
      return res.status(404).json({ message: 'No latest batch found' });
    }

    // Step 2: Fetch approved students from that batch
    const students = await Student.find({
      approved: true,
      batch: latestBatch._id,
    }).select('name _id');

    res.json(students);
  } catch (err) {
    console.error('Error fetching approved students from latest batch:', err);
    res.status(500).json({ message: 'Error fetching students' });
  }
};
