const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/webhooksController');

router.post('/clerk', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
