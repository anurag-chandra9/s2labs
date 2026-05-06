const express = require('express');
const router = express.Router();
const { createBatch, generateInvite, joinBatch, getBatches, getBatchSummary } = require('../controllers/batchController');
const { ClerkExpressRequireAuth, authorize } = require('../middleware/clerk');

router.get('/', ClerkExpressRequireAuth(), getBatches);
router.post('/', ClerkExpressRequireAuth(), authorize(['trainer', 'institution']), createBatch);

// /:id routes — order matters: more specific patterns first
router.post('/:id/invite', ClerkExpressRequireAuth(), authorize('trainer'), generateInvite);
router.post('/:id/join', ClerkExpressRequireAuth(), authorize('student'), joinBatch);
router.get('/:id/summary', ClerkExpressRequireAuth(), authorize(['institution', 'programme_manager', 'monitoring_officer']), getBatchSummary);

module.exports = router;
