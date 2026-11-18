import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getCollections } from '../db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mentorlagbe_super_secure_jwt_secret_key_2026_b14_a9';

/**
 * Middleware to verify JWT token from Authorization Header: Bearer <token> or cookie
 */
export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch latest user info from DB to guarantee role & plan accuracy
    const { usersCollection } = getCollections();
    const user = await usersCollection.findOne({ email: decoded.email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.',
      });
    }

    req.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan || 'free',
      image: user.image,
    };

    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
}

/**
 * Middleware to verify student role
 */
export function verifyStudent(req, res, next) {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Access restricted to Students only.',
    });
  }
  next();
}

/**
 * Middleware to verify tutor role
 */
export function verifyTutor(req, res, next) {
  if (!req.user || req.user.role !== 'tutor') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Access restricted to Tutors only.',
    });
  }
  next();
}

/**
 * Middleware to verify admin role
 */
export function verifyAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Access restricted to Admins only.',
    });
  }
  next();
}
