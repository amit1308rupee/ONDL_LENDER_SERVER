const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadControleerCopy');

router.post('/lender/call-lender', leadController.createLead);

module.exports = router;