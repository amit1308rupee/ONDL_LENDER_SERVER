const axios = require('axios');
const { callDedupeAPI, callCreateLeadAPI } = require('../../service/Lender/WeCredit');
const { saveLenderStatus } = require('../../models/LenderStatusModel');
const { publishMessage} = require('../service/message');
const fs = require('fs');
const path = require('path');

// Define the log file path outside the controller folder
const logFilePath = path.join(__dirname, '../..', 'logs', 'eligibility_log.json');

// Ensure the logs directory exists
if (!fs.existsSync(path.join(__dirname, '../..', 'logs'))) {
    fs.mkdirSync(path.join(__dirname, '../..', 'logs'));
}

exports.createLead = async (req) => {
    const { lenders:lender_name, lead_id } = req;

    try {
        console.log('Received request:', { lender_name, lead_id });

        // Call the partner API
        console.log('Calling partner API...');
        const partnerResponse = await axios.get(`${process.env.PARTNER_API_URL}/api/partners/lead/${lead_id}`, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Partner API response:', partnerResponse.data);
        const partnerData = partnerResponse?.data?.data;
        const mobile = partnerData.lead.mobile;

        // Call the dedupe API
        const dedupeData = await callDedupeAPI(mobile);

        // Save dedupe response
        await saveLenderStatus(lead_id, lender_name, 'check-dedupe', dedupeData);

        let createLeadResponseData;
        if (dedupeData.statusCode === 1003) {
            // Call the create lead API
            createLeadResponseData = await callCreateLeadAPI(partnerData);

            // Save create lead response
            await saveLenderStatus(lead_id, lender_name, 'create-lead', createLeadResponseData);
        }

        // Queue Message-----------------------------------------------------------------------
        const queueMessage = {
            lead_id: lead_id,
            lender_name:lender_name,
            status:"Lead Created"
        }
        try {
            console.log('Before  publishMessage - Lender_Partner');
            publishMessage("Lender_Partner","lead", queueMessage);
            console.log('After  publishMessage - Lender_Partner');
        } catch (error) {
            console.error('Error:', error);
        }
       //---------------------------------------------------------------------------------------------
        const response = {
            status: 'success',
            message: 'Process completed successfully',
            data: [
                {
                    "Dedupe-Check": dedupeData,
                    "Create-Lead": createLeadResponseData || null
                }
            ],
            errors: []
        };
        logResponse('Process completed successfully', response);
        // res.status(200).json(response);
        console.log('Process completed successfully',response);

    } catch (error) {
        console.error('Error occurred:', error);
        const response = {
            status: 'failure',
            message: 'Internal server error',
            data: null,
            errors: [{ message: error.message }]
        };
        logResponse('Error occurred', response);
        // res.status(500).json(response);
    }
};

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