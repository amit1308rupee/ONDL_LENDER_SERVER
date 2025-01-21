const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadControllerCopy');

router.post('/lender/call-lender', leadController.createLead);

module.exports = router;