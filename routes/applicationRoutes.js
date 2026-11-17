import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import { verifyToken, verifyStudent, verifyTutor } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/applications (Role-Restricted: Only Students can apply)
router.post('/', verifyToken, verifyStudent, async (req, res) => {
  try {
    const { tuitionId, studentPhone, preferredSchedule, studentNote } = req.body;

    if (!tuitionId || !studentPhone || !preferredSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Tuition ID, phone number, and preferred schedule are required.',
      });
    }

    if (!ObjectId.isValid(tuitionId)) {
      return res.status(400).json({ success: false, message: 'Invalid tuition ID format.' });
    }

    const { tuitionsCollection, applicationsCollection } = getCollections();

    // Verify Tuition
    const tuition = await tuitionsCollection.findOne({ _id: new ObjectId(tuitionId) });
    if (!tuition) {
      return res.status(404).json({ success: false, message: 'Tuition listing not found.' });
    }

    if (tuition.approvalStatus !== 'approved' || !tuition.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This tuition listing is not currently accepting applications.',
      });
    }

    // Prevent duplicate application from same student for same tuition (Core Requirement)
    const existingApp = await applicationsCollection.findOne({
      tuitionId: tuition._id.toString(),
      studentEmail: req.user.email,
    });

    if (existingApp) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this tuition. Please check your dashboard.',
      });
    }

    const newApplication = {
      tuitionId: tuition._id.toString(),
      tuitionTitle: tuition.title,
      subject: tuition.subject,
      monthlyFee: tuition.monthlyFee,
      tutorEmail: tuition.tutorEmail,
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentPhone: studentPhone.trim(),
      preferredSchedule: preferredSchedule.trim(),
      studentNote: studentNote ? studentNote.trim() : '',
      status: 'pending', // Pending Tutor decision
      appliedAt: new Date(),
    };

    const result = await applicationsCollection.insertOne(newApplication);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! The tutor will review your request.',
      applicationId: result.insertedId,
      application: { _id: result.insertedId, ...newApplication },
    });
  } catch (error) {
    console.error('Submit Application Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
});

// GET /api/applications/student/my-applications (Protected: Student view own applications)
router.get('/student/my-applications', verifyToken, verifyStudent, async (req, res) => {
  try {
    const { applicationsCollection } = getCollections();
    const applications = await applicationsCollection
      .find({ studentEmail: req.user.email })
      .sort({ appliedAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error('Student Applications Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your applications.' });
  }
});

// DELETE /api/applications/:id (Protected: Student cancel pending application)
router.delete('/:id', verifyToken, verifyStudent, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }

    const { applicationsCollection } = getCollections();
    const application = await applicationsCollection.findOne({ _id: new ObjectId(id) });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.studentEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending applications can be cancelled.',
      });
    }

    await applicationsCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: 'Application cancelled successfully.',
    });
  } catch (error) {
    console.error('Cancel Application Error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel application.' });
  }
});

// GET /api/applications/tutor/applicants (Protected: Tutor view all applicants)
router.get('/tutor/applicants', verifyToken, verifyTutor, async (req, res) => {
  try {
    const { applicationsCollection } = getCollections();
    const applicants = await applicationsCollection
      .find({ tutorEmail: req.user.email })
      .sort({ appliedAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      applicants,
    });
  } catch (error) {
    console.error('Tutor Applicants Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applicants.' });
  }
});

// PATCH /api/applications/:id/status (Protected: Tutor accept/reject applicant)
router.patch('/:id/status', verifyToken, verifyTutor, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'accepted' or 'rejected'.",
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }

    const { applicationsCollection } = getCollections();
    const application = await applicationsCollection.findOne({ _id: new ObjectId(id) });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.tutorEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await applicationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: `Application marked as ${status}.`,
    });
  } catch (error) {
    console.error('Update Application Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update application status.' });
  }
});

export default router;
