import Assignment from '../../models/Assignment.js';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/assignments/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = function (req, file, cb) {
  const allowedTypes = /pdf|jpg|jpeg|png/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
                  allowedTypes.test(file.mimetype);
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'));
  }
};

const upload = multer({ storage, fileFilter }).single('file'); // Upload single file under the 'file' field

export const createAssignment = (req, res) => {
  

  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Multer error', error: err.message });
    } else if (err) {
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }

    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Unauthorized" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const teacherId = decoded.userId;

      const {
        title,
        description,
        batchId,
        subjectId,
        subjectName,
        semester,
        startDate,
        endDate,
      } = req.body;

      if (!title || !description || !batchId || !subjectId || !semester || !startDate || !endDate) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const serverUrl = `${req.protocol}://${req.get('host')}`; // e.g., http://localhost:5000
const fileUrl = req.file ? `${serverUrl}/uploads/assignments/${req.file.filename}` : null;

      const assignment = new Assignment({
        title,
        description,
        batchId,
        subjectId,
        subjectName,
        semester,
        startDate,
        endDate,
        createdBy: teacherId,
        fileUrl,
      });

      await assignment.save();
      res.status(201).json({ message: 'Assignment created successfully', assignment });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  });
};


export const getAssignments = async (req, res) => {
  const { batchId, semester, subjectId } = req.params;
  try {
    const assignments = await Assignment.find({ batchId, semester, subjectId });
    res.status(200).json(assignments); // ✅ Should return []
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments from backend assignment controller ' });
  }
};
