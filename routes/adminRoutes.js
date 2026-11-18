import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Apply verifyToken and verifyAdmin to all routes in this router
router.use(verifyToken, verifyAdmin);

// GET /api/admin/stats (Platform Overview)
router.get('/stats', async (req, res) => {
  try {
    const { usersCollection, tuitionsCollection, applicationsCollection, paymentsCollection } =
      getCollections();

    const [
      totalUsers,
      totalTutors,
      totalStudents,
      pendingTuitions,
      approvedTuitions,
      totalApplications,
      paymentsList,
    ] = await Promise.all([
      usersCollection.countDocuments(),
      usersCollection.countDocuments({ role: 'tutor' }),
      usersCollection.countDocuments({ role: 'student' }),
      tuitionsCollection.countDocuments({ approvalStatus: 'pending' }),
      tuitionsCollection.countDocuments({ approvalStatus: 'approved' }),
      applicationsCollection.countDocuments(),
      paymentsCollection.find({ paymentStatus: 'paid' }).toArray(),
    ]);

    const totalRevenue = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalTutors,
        totalStudents,
        pendingTuitions,
        approvedTuitions,
        totalApplications,
        totalTransactions: paymentsList.length,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

// GET /api/admin/users (User Management)
router.get('/users', async (req, res) => {
  try {
    const { usersCollection } = getCollections();
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Admin Users Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// PATCH /api/admin/users/:id/role (Change User Role)
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'tutor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'student', 'tutor', or 'admin'.",
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }

    // Prevent admin self-demotion lockout
    if (req.user._id.toString() === id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot demote your own administrator account.',
      });
    }

    const { usersCollection } = getCollections();
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: `User role successfully updated to ${role}.`,
    });
  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
});

// GET /api/admin/tuitions (Tuition Moderation List)
router.get('/tuitions', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.approvalStatus = status;
    }

    const { tuitionsCollection } = getCollections();
    const tuitions = await tuitionsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      tuitions,
    });
  } catch (error) {
    console.error('Admin Tuitions Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tuitions.' });
  }
});

// PATCH /api/admin/tuitions/:id/status (Approve / Reject Tuition)
router.patch('/tuitions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved' or 'rejected'.",
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }

    // Prevent admin self-demotion lockout
    if (req.user._id.toString() === id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot demote your own administrator account.',
      });
    }

    const { tuitionsCollection } = getCollections();
    const result = await tuitionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { approvalStatus: status, reviewedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Tuition not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Tuition post has been ${status}.`,
    });
  } catch (error) {
    console.error('Tuition Moderation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to moderate tuition.' });
  }
});

// GET /api/admin/transactions (Transaction Management)
router.get('/transactions', async (req, res) => {
  try {
    const { paymentsCollection } = getCollections();
    const transactions = await paymentsCollection
      .find()
      .sort({ paidAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('Admin Transactions Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
});

export default router;
