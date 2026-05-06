const prisma = require('../lib/prisma');

// POST /attendance/mark — Student marks their own attendance
const markAttendance = async (req, res) => {
  const { sessionId, status } = req.body;
  const studentId = req.auth.userId;

  if (!sessionId || !status) {
    return res.status(400).json({ message: 'sessionId and status are required' });
  }
  if (!['present', 'absent', 'late'].includes(status)) {
    return res.status(400).json({ message: 'status must be present, absent, or late' });
  }

  try {
    // Student must be enrolled in the batch this session belongs to
    const session = await prisma.session.findFirst({
      where: { id: sessionId, batch: { students: { some: { id: studentId } } } },
    });
    if (!session) {
      return res.status(403).json({ message: 'You are not enrolled in this session\'s batch' });
    }

    // Upsert — allow updating if already marked
    const attendance = await prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId, studentId } },
      update: { status, markedAt: new Date() },
      create: { sessionId, studentId, status },
    });
    res.json(attendance);
  } catch (err) {
    console.error('markAttendance:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { markAttendance };
