const express = require('express');
const router = express.Router();
const { getProgrammeSummary } = require('../controllers/summaryController');
const { ClerkExpressRequireAuth, authorize } = require('../middleware/clerk');

router.get('/summary', ClerkExpressRequireAuth(), authorize(['programme_manager', 'monitoring_officer']), getProgrammeSummary);

module.exports = router;
