const pool = require('../config/database');

const saveLenderStatus = async (lead_id, lender_name, api_name, responseData) => {
    console.log('Saving lender status...');
    try {
            const [status_code, status_message, lender_lead_id, offer, offer_lender] = parseResponseData(responseData);
            await pool.query(
                'INSERT INTO LenderStatus (lead_id, lender_name, api_name, status_code, status_message, lender_lead_id, offer, offer_lender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [lead_id, lender_name, api_name, status_code, status_message, lender_lead_id, offer, offer_lender]
            );
      
    } catch (error) {
        console.error('Error saving lender status:', error);
        throw error;
    }
};

// Function to parse response data
const parseResponseData = (responseData) => {
    const status_code = responseData.statusCode || null;
    const status_message = responseData.statusMessage || null;
    const lender_lead_id = responseData.leadId || null;
    const offer = responseData.offer || null;
    const offer_lender = responseData.lender || null;
    return [status_code, status_message, lender_lead_id, offer, offer_lender];
};

module.exports = { saveLenderStatus };