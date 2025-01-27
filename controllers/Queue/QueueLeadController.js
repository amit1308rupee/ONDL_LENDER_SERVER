const axios = require('axios');
const { processWeCreditLead } = require('../../service/Lender/WeCredit');
const fs = require('fs');
const path = require('path');

// Define the log file path outside the controller folder
const logFilePath = path.join(__dirname, '../..', 'logs', 'eligibility_log.json');

// Ensure the logs directory exists
if (!fs.existsSync(path.join(__dirname, '../..', 'logs'))) {
    fs.mkdirSync(path.join(__dirname, '../..', 'logs'));
}

// Function to log response to a file
function logResponse(event, response) {
    const logEntry = {
        event,
        timestamp: new Date().toISOString(),
        response
    };
    fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n', (err) => {
        if (err) {
            console.error('Error logging response:', err);
        }
    });
}

exports.createLead = async (req) => {
    const { lenders: lender_name, lead_id } = req;

    try {
        console.log('Received request:', { lender_name, lead_id });

        // Call the partner API
        console.log('Calling partner API...');
        const partnerResponse = await axios.get(`${process.env.PARTNER_API_URL}/api/partners/lead/${lead_id}`, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Partner API response:', partnerResponse.data);
        const partnerData = partnerResponse?.data?.data;

        if (lender_name === "WeCredit") {
            await processWeCreditLead(partnerData, lead_id, lender_name);
        } else if (lender_name === "fibe") {
            await processWeCreditLead(partnerData, lead_id, lender_name);
        }
        else {
            // Handle other lenders if necessary
        }

    } catch (error) {
        console.error('Error occurred:', error);
        const response = {
            status: 'failure',
            message: 'Internal server error',
            data: null,
            errors: [{ message: error.message }]
        };
        logResponse('Error occurred', response);
    }
};