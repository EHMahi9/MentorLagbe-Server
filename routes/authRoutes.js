import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getCollections } from '../db.js';
import { verifyToken } from '../middlewares/auth.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mentorlagbe_super_secure_jwt_secret_key_2026_b14_a9';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!['student', 'tutor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either student or tutor during registration.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const { usersCollection } = getCollections();
    const existingUser = await usersCollection.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      plan: 'free',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      phone: '',
      bio: '',
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    const userPayload = {
      _id: result.insertedId.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      plan: newUser.plan,
      image: newUser.image,
      phone: newUser.phone,
      bio: newUser.bio,
    };

    const token = jwt.sign(
      { id: userPayload._id, email: userPayload.email, role: userPayload.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { usersCollection } = getCollections();
    const user = await usersCollection.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const userPayload = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan || 'free',
      image: user.image || '',
      phone: user.phone || '',
      bio: user.bio || '',
    };

    const token = jwt.sign(
      { id: userPayload._id, email: userPayload.email, role: userPayload.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('Auth Me Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current user.',
    });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential, role } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required.' });
    }

    // Verify token with Google API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      return res.status(401).json({ success: false, message: 'Invalid or expired Google credential.' });
    }

    const payload = await googleRes.json();
    const cleanEmail = payload.email.toLowerCase().trim();

    const { usersCollection } = getCollections();
    let user = await usersCollection.findOne({ email: cleanEmail });

    if (!user) {
      // Create new user from Google profile
      const newUser = {
        name: payload.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        image: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || 'User')}&background=0D9488&color=fff`,
        role: role === 'tutor' ? 'tutor' : 'student',
        plan: 'free',
        googleId: payload.sub,
        emailVerified: payload.email_verified || true,
        phone: '',
        bio: 'Joined via Google Sign-In',
        createdAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);
      user = { _id: result.insertedId, ...newUser };
    }

    const userPayload = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan || 'free',
      image: user.image,
      bio: user.bio,
    };

    const token = jwt.sign(
      { id: userPayload._id, email: userPayload.email, role: userPayload.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Logged in with Google successfully.',
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during Google authentication.',
    });
  }
});

export default router;
