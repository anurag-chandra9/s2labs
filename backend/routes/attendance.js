const express = require('express');
const router = express.Router();
const { markAttendance } = require('../controllers/attendanceController');
const { ClerkExpressRequireAuth, authorize } = require('../middleware/clerk');

router.post('/mark', ClerkExpressRequireAuth(), authorize('student'), markAttendance);

module.exports = router;
