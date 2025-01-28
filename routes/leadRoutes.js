const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadControllerCopy');
const authMiddleware = require('../middleware/auth');

router.post('/lender/call-lender', leadController.createLead);
router.get('/lender/leads/:lender_name', authMiddleware, leadController.getLenderLeads);
router.post("/webhook/wc/status",authMiddleware, (req, res) => {
    const payload = req.body;
    console.log("Webhook received:", payload);
    return res.status(200).json({payload})
});// Extracting data from the payload const { leadId, lenderMessage, offerAmount, statusCode, statusMessage, utmLink, } = payload; // Respond to the sender res.status(200).send({ message: "Webhook received successfully" }); });

module.exports = router;