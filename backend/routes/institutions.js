const express = require('express');
const router = express.Router();
const {
  getInstitutions,
  createInstitution,
  getInstitutionSummary,
} = require('../controllers/summaryController');
const { ClerkExpressRequireAuth, authorize } = require('../middleware/clerk');

router.get('/', ClerkExpressRequireAuth(), getInstitutions);
router.post('/', ClerkExpressRequireAuth(), authorize(['institution', 'programme_manager']), createInstitution);
router.get('/:id/summary', ClerkExpressRequireAuth(), authorize(['programme_manager', 'monitoring_officer']), getInstitutionSummary);

module.exports = router;
