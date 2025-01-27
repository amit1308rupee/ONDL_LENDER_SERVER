const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadControllerCopy');
const authMiddleware = require('../middleware/auth');

router.post('/lender/call-lender', leadController.createLead);
router.get('/lender/leads/:lender_name', authMiddleware, leadController.getLenderLeads);

module.exports = router;