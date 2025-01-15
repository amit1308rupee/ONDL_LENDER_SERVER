const mongoose = require('mongoose');

const lenderStatusSchema = new mongoose.Schema({
    lead_id: String,
    lender_name: String,
    api_name: String,
    parameter_name: String,
    parameter_value: String,
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LenderStatus', lenderStatusSchema);