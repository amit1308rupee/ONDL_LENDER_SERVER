const express = require('express');
const morgan = require('morgan');
const cors = require('cors'); 
const leadRoutes = require('./routes/leadRoutes');
const { consumeMessagesBreLender} = require('./service/consumer');
const authMiddleware = require('./middleware/auth');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cors())

// Routes
app.use('/api', leadRoutes);

//WebHook
app.post("/webhook/wc/status",authMiddleware, (req, res) => {
    const payload = req.body;
    console.log("Webhook received:", payload);
    return res.status(200).json({payload})
});// Extracting data from the payload const { leadId, lenderMessage, offerAmount, statusCode, statusMessage, utmLink, } = payload; // Respond to the sender res.status(200).send({ message: "Webhook received successfully" }); });



//Queue
try {
    consumeMessagesBreLender("Bre_Lender","lead", "Bre_Lender");
    console.log("Bre_Lender - receive message from Bre");
} catch (error) {
    console.error('Error:', error);
}



module.exports = app;
