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


const getLenderStatusByDateRange = async (lender_name, startDate, endDate) => {
    const query = `
        SELECT 
            DATE(created_at) as date,
            COUNT(CASE WHEN status_code >= 1000 AND status_code < 2000 THEN 1 END) as Dedupe,
            COUNT(CASE WHEN status_code >= 2000 AND status_code < 3000 THEN 1 END) as 'In-Progress',
            COUNT(CASE WHEN status_code >= 3000 AND status_code < 4000 THEN 1 END) as Rejected,
            COUNT(CASE WHEN status_code >= 4000 AND status_code < 5000 THEN 1 END) as Disbursed,
            COUNT(CASE WHEN status_code >= 5000 THEN 1 END) as 'Create Failed'
        FROM LenderStatus
        WHERE lender_name = ? AND created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
    `;
    const [results] = await pool.query(query, [lender_name, startDate, endDate]);
    return results;
};

module.exports = { saveLenderStatus , getLenderStatusByDateRange};