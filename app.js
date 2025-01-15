const express = require('express');
const morgan = require('morgan');
const cors = require('cors'); 
const leadRoutes = require('./routes/leadRoutes');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cors())

// Routes
app.use('/api', leadRoutes);



module.exports = app;
