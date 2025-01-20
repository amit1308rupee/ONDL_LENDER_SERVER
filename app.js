const express = require('express');
const morgan = require('morgan');
const cors = require('cors'); 
const leadRoutes = require('./routes/leadRoutes');
const { consumeMessagesBreLender} = require('./service/consumer');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cors())

// Routes
app.use('/api', leadRoutes);


//Queue
try {
    consumeMessagesBreLender("Bre_Lender","lead", "Bre_Lender");
    console.log("Bre_Lender - receive message from Bre");
} catch (error) {
    console.error('Error:', error);
}



module.exports = app;
