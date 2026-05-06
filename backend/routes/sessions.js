const express = require('express');
const router = express.Router();
const {
  createSession,
  getTrainerSessions,
  getStudentSessions,
  getSessionAttendance,
} = require('../controllers/sessionController');
const { ClerkExpressRequireAuth, authorize } = require('../middleware/clerk');

router.post('/', ClerkExpressRequireAuth(), authorize('trainer'), createSession);
router.get('/trainer', ClerkExpressRequireAuth(), authorize('trainer'), getTrainerSessions);
router.get('/student', ClerkExpressRequireAuth(), authorize('student'), getStudentSessions);
router.get('/:id/attendance', ClerkExpressRequireAuth(), authorize('trainer'), getSessionAttendance);

module.exports = router;
