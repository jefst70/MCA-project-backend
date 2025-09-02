import jwt from 'jsonwebtoken';

export const verifyTokenAndTeacher = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Attach properly structured user object
      req.user = {
        _id: decoded.userId, // Match usage in routes
        role: decoded.role,
      };

      // ✅ Optional: Ensure it's a teacher
      if (decoded.role !== 'teacher') {
        return res.status(403).json({ error: 'Access denied: Teachers only' });
      }

      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ error: 'Token not provided' });
  }
};


export const verifyTokenAndStudent = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Attach decoded student info to request
      req.user = {
        _id: decoded.userId,
        role: decoded.role,
      };

      // ✅ Ensure the role is 'student'
      if (decoded.role !== 'student') {
        return res.status(403).json({ error: 'Access denied: Students only' });
      }

      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ error: 'Token not provided' });
  }
};
