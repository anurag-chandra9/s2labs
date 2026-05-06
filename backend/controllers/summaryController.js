const prisma = require('../lib/prisma');

// GET /institutions/:id/summary — All batches in an institution with attendance rates
const getInstitutionSummary = async (req, res) => {
  const { id } = req.params;

  try {
    const institution = await prisma.institution.findUnique({
      where: { id },
      include: {
        batches: {
          include: {
            _count: { select: { students: true, sessions: true } },
            sessions: { include: { attendances: true } },
          },
        },
      },
    });
    if (!institution) return res.status(404).json({ message: 'Institution not found' });

    const batchSummaries = institution.batches.map((batch) => {
      const totalAttendances = batch.sessions.reduce((sum, s) => sum + s.attendances.length, 0);
      const presentCount = batch.sessions.reduce(
        (sum, s) => sum + s.attendances.filter((a) => a.status === 'present').length,
        0
      );
      return {
        batchId: batch.id,
        batchName: batch.name,
        totalStudents: batch._count.students,
        totalSessions: batch._count.sessions,
        attendanceRate: totalAttendances > 0
          ? Math.round((presentCount / totalAttendances) * 100)
          : 0,
      };
    });

    res.json({ institution: { id: institution.id, name: institution.name }, batchSummaries });
  } catch (err) {
    console.error('getInstitutionSummary:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /programme/summary — Programme-wide view across all institutions
const getProgrammeSummary = async (req, res) => {
  try {
    const institutions = await prisma.institution.findMany({
      include: {
        _count: { select: { batches: true } },
        batches: {
          include: {
            _count: { select: { students: true, sessions: true } },
            sessions: { include: { attendances: true } },
          },
        },
      },
    });

    const summary = institutions.map((inst) => {
      const totalStudents = inst.batches.reduce((sum, b) => sum + b._count.students, 0);
      const totalSessions = inst.batches.reduce((sum, b) => sum + b._count.sessions, 0);
      const totalAttendances = inst.batches.reduce(
        (sum, b) => sum + b.sessions.reduce((s2, s) => s2 + s.attendances.length, 0),
        0
      );
      const presentCount = inst.batches.reduce(
        (sum, b) => sum + b.sessions.reduce(
          (s2, s) => s2 + s.attendances.filter((a) => a.status === 'present').length,
          0
        ),
        0
      );
      return {
        institutionId: inst.id,
        institutionName: inst.name,
        totalBatches: inst._count.batches,
        totalStudents,
        totalSessions,
        attendanceRate: totalAttendances > 0
          ? Math.round((presentCount / totalAttendances) * 100)
          : 0,
      };
    });

    res.json({ totalInstitutions: institutions.length, summary });
  } catch (err) {
    console.error('getProgrammeSummary:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /institutions — List all institutions (used by trainer when creating a batch)
const getInstitutions = async (req, res) => {
  try {
    const institutions = await prisma.institution.findMany({
      select: { id: true, name: true, address: true },
      orderBy: { name: 'asc' },
    });
    res.json(institutions);
  } catch (err) {
    console.error('getInstitutions:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /institutions — Create an institution
const createInstitution = async (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });

  try {
    const institution = await prisma.institution.create({ data: { name, address } });
    res.status(201).json(institution);
  } catch (err) {
    console.error('createInstitution:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getInstitutionSummary, getProgrammeSummary, getInstitutions, createInstitution };
