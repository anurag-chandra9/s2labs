const prisma = require('../lib/prisma');
const crypto = require('crypto');
const { getRole } = require('../middleware/clerk');

// POST /batches — Trainer or Institution creates a batch
const createBatch = async (req, res) => {
  const { name, institutionId, description } = req.body;
  const userId = req.auth.userId;
  const role = getRole(req);

  if (!name || !institutionId) {
    return res.status(400).json({ message: 'name and institutionId are required' });
  }

  try {
    const data = {
      name,
      institutionId,
      description: description || '',
      // Auto-assign trainer to the batch they create
      ...(role === 'trainer' && { trainers: { connect: { id: userId } } }),
    };

    const batch = await prisma.batch.create({
      data,
      include: { trainers: { select: { id: true, name: true } } },
    });
    res.status(201).json(batch);
  } catch (err) {
    console.error('createBatch:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /batches/:id/invite — Trainer generates a reusable invite link
const generateInvite = async (req, res) => {
  const { id } = req.params;
  const trainerId = req.auth.userId;

  try {
    const batch = await prisma.batch.findFirst({
      where: { id, trainers: { some: { id: trainerId } } },
    });
    if (!batch) {
      return res.status(403).json({ message: 'Batch not found or you are not a trainer for it' });
    }

    const inviteCode = crypto.randomBytes(8).toString('hex');
    await prisma.batch.update({ where: { id }, data: { inviteCode } });

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${inviteCode}`;
    res.json({ inviteCode, inviteUrl, batchName: batch.name });
  } catch (err) {
    console.error('generateInvite:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /batches/:id/join — Student joins batch using invite code
// :id here is the inviteCode (matches the URL the student receives)
const joinBatch = async (req, res) => {
  const { id: inviteCode } = req.params;
  const studentId = req.auth.userId;

  try {
    const batch = await prisma.batch.findUnique({ where: { inviteCode } });
    if (!batch) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check if already joined
    const alreadyJoined = await prisma.batch.findFirst({
      where: { id: batch.id, students: { some: { id: studentId } } },
    });
    if (alreadyJoined) {
      return res.status(400).json({ message: 'You are already in this batch' });
    }

    await prisma.batch.update({
      where: { id: batch.id },
      data: { students: { connect: { id: studentId } } },
    });

    res.json({ message: 'Joined batch successfully', batchName: batch.name, batchId: batch.id });
  } catch (err) {
    console.error('joinBatch:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /batches — Role-filtered batch list
const getBatches = async (req, res) => {
  const userId = req.auth.userId;
  const role = getRole(req);

  try {
    let batches;

    if (role === 'trainer') {
      batches = await prisma.batch.findMany({
        where: { trainers: { some: { id: userId } } },
        include: { _count: { select: { students: true, sessions: true } } },
      });
    } else if (role === 'student') {
      batches = await prisma.batch.findMany({
        where: { students: { some: { id: userId } } },
        include: { _count: { select: { sessions: true } } },
      });
    } else if (role === 'institution') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.institutionId) {
        return res.json([]); // not yet assigned to an institution
      }
      batches = await prisma.batch.findMany({
        where: { institutionId: user.institutionId },
        include: {
          trainers: { select: { id: true, name: true } },
          _count: { select: { students: true, sessions: true } },
        },
      });
    } else {
      // programme_manager, monitoring_officer — see everything
      batches = await prisma.batch.findMany({
        include: {
          institution: { select: { name: true } },
          _count: { select: { students: true, sessions: true } },
        },
      });
    }

    res.json(batches);
  } catch (err) {
    console.error('getBatches:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /batches/:id/summary — Attendance summary for a batch
const getBatchSummary = async (req, res) => {
  const { id } = req.params;

  try {
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        students: { select: { id: true, name: true, email: true } },
        sessions: { include: { attendances: true } },
      },
    });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const totalSessions = batch.sessions.length;
    const summary = batch.students.map((student) => {
      const attended = batch.sessions.filter((session) =>
        session.attendances.some((a) => a.studentId === student.id && a.status === 'present')
      ).length;
      return {
        student,
        attended,
        totalSessions,
        percentage: totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0,
      };
    });

    res.json({ batch: { id: batch.id, name: batch.name }, totalSessions, summary });
  } catch (err) {
    console.error('getBatchSummary:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createBatch, generateInvite, joinBatch, getBatches, getBatchSummary };
