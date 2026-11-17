import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import { verifyToken, verifyTutor } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/tuitions (Public Browse with Search, Filter & Server-side Pagination)
router.get('/', async (req, res) => {
  try {
    const {
      search,
      subject,
      classLevel,
      mode,
      page = 1,
      limit = 9,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {
      approvalStatus: 'approved',
      isActive: true,
    };

    // Server-Side Search (Challenge 1)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { subject: searchRegex }, { location: searchRegex }];
    }

    // Filter by Subject
    if (subject && subject !== 'All') {
      query.subject = new RegExp(`^${subject.trim()}$`, 'i');
    }

    // Filter by Class Level
    if (classLevel && classLevel !== 'All') {
      query.classLevel = new RegExp(`^${classLevel.trim()}$`, 'i');
    }

    // Filter by Mode (Online / Offline)
    if (mode && mode !== 'All') {
      query.mode = mode;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    if (sortBy === 'monthlyFee') {
      sortOption.monthlyFee = order === 'asc' ? 1 : -1;
    } else {
      sortOption.createdAt = order === 'asc' ? 1 : -1;
    }

    const { tuitionsCollection } = getCollections();
    const total = await tuitionsCollection.countDocuments(query);
    const tuitions = await tuitionsCollection
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    res.status(200).json({
      success: true,
      tuitions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Fetch Tuitions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tuitions.',
    });
  }
});

// GET /api/tuitions/featured (6 latest approved & active tuitions for Landing Page)
router.get('/featured', async (req, res) => {
  try {
    const { tuitionsCollection } = getCollections();
    const tuitions = await tuitionsCollection
      .find({ approvalStatus: 'approved', isActive: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.status(200).json({
      success: true,
      tuitions,
    });
  } catch (error) {
    console.error('Featured Tuitions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured tuitions.',
    });
  }
});

// GET /api/tuitions/tutor/my-tuitions (Protected: Tutor's own tuitions)
router.get('/tutor/my-tuitions', verifyToken, verifyTutor, async (req, res) => {
  try {
    const { tuitionsCollection } = getCollections();
    const tuitions = await tuitionsCollection
      .find({ tutorEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      tuitions,
    });
  } catch (error) {
    console.error('My Tuitions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tutor tuitions.',
    });
  }
});

// GET /api/tuitions/:id (Public Single Tuition Details)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tuition ID format.',
      });
    }

    const { tuitionsCollection, usersCollection } = getCollections();
    const tuition = await tuitionsCollection.findOne({ _id: new ObjectId(id) });

    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: 'Tuition not found.',
      });
    }

    // Fetch tutor bio and image for the summary card
    const tutor = await usersCollection.findOne(
      { email: tuition.tutorEmail },
      { projection: { password: 0 } }
    );

    res.status(200).json({
      success: true,
      tuition: {
        ...tuition,
        tutorProfile: tutor || null,
      },
    });
  } catch (error) {
    console.error('Single Tuition Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tuition details.',
    });
  }
});

// POST /api/tuitions (Protected: Tutor create tuition post)
router.post('/', verifyToken, verifyTutor, async (req, res) => {
  try {
    const {
      title,
      subject,
      classLevel,
      mode,
      location,
      monthlyFee,
      daysPerWeek,
      bannerImage,
      description,
    } = req.body;

    if (!title || !subject || !classLevel || !monthlyFee || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.',
      });
    }

    const { tuitionsCollection } = getCollections();

    // Enforce 2-post limit for Free Plan Tutors (Core Requirement)
    if (req.user.plan !== 'pro') {
      const existingCount = await tuitionsCollection.countDocuments({
        tutorEmail: req.user.email,
      });

      if (existingCount >= 2) {
        return res.status(403).json({
          success: false,
          limitReached: true,
          message:
            'Free Plan allows a maximum of 2 tuition posts. Please upgrade to the Pro Plan for unlimited posts and priority listing.',
        });
      }
    }

    const newTuition = {
      title: title.trim(),
      subject: subject.trim(),
      classLevel: classLevel.trim(),
      mode: mode || 'Online',
      location: location ? location.trim() : mode === 'Online' ? 'Online (Zoom / Meet)' : 'In-person',
      monthlyFee: Number(monthlyFee),
      daysPerWeek: daysPerWeek || '3 days/week',
      bannerImage:
        bannerImage ||
        'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
      description: description.trim(),
      tutorName: req.user.name,
      tutorEmail: req.user.email,
      approvalStatus: 'pending', // Pending Admin Moderation
      isActive: true,
      createdAt: new Date(),
    };

    const result = await tuitionsCollection.insertOne(newTuition);

    res.status(201).json({
      success: true,
      message: 'Tuition post created successfully and submitted for Admin approval.',
      tuitionId: result.insertedId,
      tuition: { _id: result.insertedId, ...newTuition },
    });
  } catch (error) {
    console.error('Create Tuition Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tuition post.',
    });
  }
});

// PUT /api/tuitions/:id (Protected: Tutor edit own tuition)
router.put('/:id', verifyToken, verifyTutor, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }

    const { tuitionsCollection } = getCollections();
    const tuition = await tuitionsCollection.findOne({ _id: new ObjectId(id) });

    if (!tuition) {
      return res.status(404).json({ success: false, message: 'Tuition not found.' });
    }

    if (tuition.tutorEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this tuition.' });
    }

    const {
      title,
      subject,
      classLevel,
      mode,
      location,
      monthlyFee,
      daysPerWeek,
      bannerImage,
      description,
    } = req.body;

    const updateDoc = {
      $set: {
        ...(title && { title: title.trim() }),
        ...(subject && { subject: subject.trim() }),
        ...(classLevel && { classLevel: classLevel.trim() }),
        ...(mode && { mode }),
        ...(location && { location: location.trim() }),
        ...(monthlyFee !== undefined && { monthlyFee: Number(monthlyFee) }),
        ...(daysPerWeek && { daysPerWeek }),
        ...(bannerImage && { bannerImage }),
        ...(description && { description: description.trim() }),
        updatedAt: new Date(),
      },
    };

    await tuitionsCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);

    res.status(200).json({
      success: true,
      message: 'Tuition post updated successfully.',
    });
  } catch (error) {
    console.error('Update Tuition Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update tuition.' });
  }
});

// DELETE /api/tuitions/:id (Protected: Tutor delete own tuition)
router.delete('/:id', verifyToken, verifyTutor, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }

    const { tuitionsCollection } = getCollections();
    const tuition = await tuitionsCollection.findOne({ _id: new ObjectId(id) });

    if (!tuition) {
      return res.status(404).json({ success: false, message: 'Tuition not found.' });
    }

    if (tuition.tutorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this tuition.' });
    }

    await tuitionsCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: 'Tuition post deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Tuition Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete tuition.' });
  }
});

// PATCH /api/tuitions/:id/toggle-active (Protected: Tutor toggle active/closed)
router.patch('/:id/toggle-active', verifyToken, verifyTutor, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }

    const { tuitionsCollection } = getCollections();
    const tuition = await tuitionsCollection.findOne({ _id: new ObjectId(id) });

    if (!tuition) {
      return res.status(404).json({ success: false, message: 'Tuition not found.' });
    }

    if (tuition.tutorEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const newActiveState = !tuition.isActive;
    await tuitionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: newActiveState } }
    );

    res.status(200).json({
      success: true,
      isActive: newActiveState,
      message: `Tuition status is now ${newActiveState ? 'Active' : 'Closed'}.`,
    });
  } catch (error) {
    console.error('Toggle Active Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

export default router;
