// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent  from '../models/Parent.js';
import Admin   from '../models/Admin.js';

/**
 * 1️⃣  Verify that the request carries a valid JWT in the
 *     Authorization header: `Bearer <token>`.
 * 2️⃣  Attach the user document (minus password) to `req.user`
 *     so downstream handlers can trust it.
 * // middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // assuming you now use a unified model

export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password'); // ✅ Attach user

      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

 */

// ✅ Updated protect middleware

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};




export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userId = decoded.userId;
      const role = decoded.role;

      let user;
      if (role === 'parent') {
        user = await Parent.findById(userId).select('-password');
      } else if (role === 'student') {
        user = await Student.findById(userId).select('-password');
      } else if (role === 'teacher') {
        user = await Teacher.findById(userId).select('-password');
      } else if (role === 'admin') {
        user = await Admin.findById(userId).select('-password');
      }

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      req.userRole = role;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};


export const isAuthenticated = async (req, res, next) => {
  const auth = req.headers.authorization;

  /* ─── 1. Header present & well-formed? ───────────────────── */
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = auth.split(' ')[1];

  try {
    /* ─── 2. Decode & verify JWT ───────────────────────────── */
    const { userId, role } = jwt.verify(token, process.env.JWT_SECRET);

    /* ─── 3. Fetch the user from the correct collection ────── */
    let Model;
    switch (role?.toLowerCase()) {
      case 'student': Model = Student; break;
      case 'teacher': Model = Teacher; break;
      case 'parent':  Model = Parent;  break;
      case 'admin':   Model = Admin;   break;
      default:
        return res.status(401).json({ message: 'Invalid role in token' });
    }

    const user = await Model.findById(userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    /* ─── 4. Stash the user & role for later middleware ────── */
    req.user      = user;      // full user document
    req.user.role = role;      // ensure the role string travels along

    next(); // ✅ authenticated, proceed
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

/* ------------------------------------------------------------------ */
/* Optional helper: drop-in role guard (DRY)                           */
/* Usage: router.post('/something', isAuthenticated, allowRoles('teacher'), handler) */
export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

/* Convenience shorthands, if you like */
export const isAdmin    = allowRoles('admin');
export const isTeacher  = allowRoles('teacher');
export const isStudent  = allowRoles('student');
export const isParent   = allowRoles('parent');
