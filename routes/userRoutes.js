import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// PUT /api/users/profile (Update Profile Page for all authenticated users)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, bio, image } = req.body;
    const { usersCollection } = getCollections();

    const updateDoc = {
      $set: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(image && { image }),
        updatedAt: new Date(),
      },
    };

    await usersCollection.updateOne({ email: req.user.email }, updateDoc);

    const updatedUser = await usersCollection.findOne(
      { email: req.user.email },
      { projection: { password: 0 } }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// GET /api/users/bookmarks (Optional 3: Get Bookmarked Tuitions for Student)
router.get('/bookmarks', verifyToken, async (req, res) => {
  try {
    const { usersCollection, tuitionsCollection } = getCollections();
    const user = await usersCollection.findOne({ email: req.user.email });

    const bookmarkIds = (user?.bookmarks || []).map((id) => {
      try {
        return new ObjectId(id);
      } catch {
        return null;
      }
    }).filter(Boolean);

    if (bookmarkIds.length === 0) {
      return res.status(200).json({ success: true, bookmarks: [] });
    }

    const bookmarkedTuitions = await tuitionsCollection
      .find({ _id: { $in: bookmarkIds } })
      .toArray();

    res.status(200).json({
      success: true,
      bookmarks: bookmarkedTuitions,
    });
  } catch (error) {
    console.error('Fetch Bookmarks Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookmarks.' });
  }
});

// POST /api/users/bookmarks/:tuitionId (Optional 3: Toggle Bookmark)
router.post('/bookmarks/:tuitionId', verifyToken, async (req, res) => {
  try {
    const { tuitionId } = req.params;
    const { usersCollection } = getCollections();
    const user = await usersCollection.findOne({ email: req.user.email });

    const currentBookmarks = user?.bookmarks || [];
    const exists = currentBookmarks.includes(tuitionId);

    let updatedBookmarks;
    if (exists) {
      updatedBookmarks = currentBookmarks.filter((id) => id !== tuitionId);
    } else {
      updatedBookmarks = [...currentBookmarks, tuitionId];
    }

    await usersCollection.updateOne(
      { email: req.user.email },
      { $set: { bookmarks: updatedBookmarks } }
    );

    res.status(200).json({
      success: true,
      bookmarked: !exists,
      message: exists ? 'Tuition removed from bookmarks.' : 'Tuition saved to bookmarks.',
      bookmarks: updatedBookmarks,
    });
  } catch (error) {
    console.error('Toggle Bookmark Error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
  }
});

// GET /api/users/stats/student (Student Dashboard Stats)
router.get('/stats/student', verifyToken, async (req, res) => {
  try {
    const { applicationsCollection } = getCollections();
    const studentEmail = req.user.email;

    const [totalApplied, accepted, pending, rejected] = await Promise.all([
      applicationsCollection.countDocuments({ studentEmail }),
      applicationsCollection.countDocuments({ studentEmail, status: 'accepted' }),
      applicationsCollection.countDocuments({ studentEmail, status: 'pending' }),
      applicationsCollection.countDocuments({ studentEmail, status: 'rejected' }),
    ]);

    const acceptanceRate = totalApplied > 0 ? Math.round((accepted / totalApplied) * 100) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalApplied,
        accepted,
        pending,
        rejected,
        acceptanceRate,
        plan: req.user.plan || 'free',
      },
    });
  } catch (error) {
    console.error('Student Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student stats.' });
  }
});

// GET /api/users/stats/tutor (Tutor Dashboard Stats)
router.get('/stats/tutor', verifyToken, async (req, res) => {
  try {
    const { tuitionsCollection, applicationsCollection } = getCollections();
    const tutorEmail = req.user.email;

    const [totalTuitions, activeApproved, pendingApproval, totalApplicants] = await Promise.all([
      tuitionsCollection.countDocuments({ tutorEmail }),
      tuitionsCollection.countDocuments({ tutorEmail, approvalStatus: 'approved', isActive: true }),
      tuitionsCollection.countDocuments({ tutorEmail, approvalStatus: 'pending' }),
      applicationsCollection.countDocuments({ tutorEmail }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalTuitions,
        activeApproved,
        pendingApproval,
        totalApplicants,
        plan: req.user.plan || 'free',
      },
    });
  } catch (error) {
    console.error('Tutor Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tutor stats.' });
  }
});

export default router;
