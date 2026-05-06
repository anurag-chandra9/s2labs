const prisma = require('../lib/prisma');

// POST /sessions — Trainer creates a session
const createSession = async (req, res) => {
  const { title, batchId, date, startTime, endTime } = req.body;
  const trainerId = req.auth.userId;

  if (!title || !batchId || !date || !startTime || !endTime) {
    return res.status(400).json({ message: 'title, batchId, date, startTime, endTime are required' });
  }

  try {
    // Trainer must belong to the batch
    const batch = await prisma.batch.findFirst({
      where: { id: batchId, trainers: { some: { id: trainerId } } },
    });
    if (!batch) {
      return res.status(403).json({ message: 'You are not a trainer for this batch' });
    }

    const session = await prisma.session.create({
      data: { title, batchId, trainerId, date: new Date(date), startTime, endTime },
      include: { batch: { select: { name: true } } },
    });
    res.status(201).json(session);
  } catch (err) {
    console.error('createSession:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /sessions/trainer — Trainer's own sessions
const getTrainerSessions = async (req, res) => {
  const trainerId = req.auth.userId;
  try {
    const sessions = await prisma.session.findMany({
      where: { trainerId },
      include: {
        batch: { select: { name: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(sessions);
  } catch (err) {
    console.error('getTrainerSessions:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /sessions/student — Sessions for the student's enrolled batches
const getStudentSessions = async (req, res) => {
  const studentId = req.auth.userId;
  try {
    const sessions = await prisma.session.findMany({
      where: { batch: { students: { some: { id: studentId } } } },
      include: {
        batch: { select: { name: true } },
        trainer: { select: { name: true } },
        // Only this student's attendance record
        attendances: { where: { studentId }, select: { status: true, markedAt: true } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(sessions);
  } catch (err) {
    console.error('getStudentSessions:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /sessions/:id/attendance — Full attendance for a session (trainer only)
const getSessionAttendance = async (req, res) => {
  const { id } = req.params;
  const trainerId = req.auth.userId;

  try {
    const session = await prisma.session.findFirst({
      where: { id, trainerId },
      include: {
        batch: {
          include: { students: { select: { id: true, name: true, email: true } } },
        },
        attendances: {
          include: { student: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!session) {
      return res.status(404).json({ message: 'Session not found or not yours' });
    }
    res.json(session);
  } catch (err) {
    console.error('getSessionAttendance:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createSession, getTrainerSessions, getStudentSessions, getSessionAttendance };
