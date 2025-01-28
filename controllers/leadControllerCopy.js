const axios = require('axios');
const { processWeCreditLead } = require('../service/Lender/WeCredit');
const { saveLenderStatus, getLenderStatusByDateRange } = require('../models/LenderStatusModel');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Define the log file path outside the controller folder
const logFilePath = path.join(__dirname, '../..', 'logs', 'eligibility_log.json');

// Ensure the logs directory exists
if (!fs.existsSync(path.join(__dirname, '../..', 'logs'))) {
    fs.mkdirSync(path.join(__dirname, '../..', 'logs'));
}

exports.createLead = async (req, res) => {
    const { lender_name, lead_id } = req.body;

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

        if (lender_name === "WeCredit") {
            await processWeCreditLead(partnerData, lead_id, lender_name);
        } else {
            // Handle other lenders if necessary
        }
        console.log('Process completed successfully');

    } catch (error) {
        console.error('Error occurred:', error);
        const response = {
            status: 'failure',
            message: 'Internal server error',
            data: null,
            errors: [{ message: error.message }]
        };
        logResponse('Error occurred', response);
        res.status(500).json(response);
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

exports.getLenderLeads = async (req, res) => {
    const { lender_name } = req.params;
    const endDate = moment().startOf('day');
    const startDate = moment().subtract(6, 'days').startOf('day'); // Subtract 6 days to include today

    try {
        const results = await getLenderStatusByDateRange(lender_name, startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'));

        // Create a map of results by date for easy lookup
        const resultsMap = results.reduce((map, result) => {
            map[moment(result.date).format('YYYY-MM-DD')] = result;
            return map;
        }, {});

        // Generate the complete date range and fill in missing dates with zero values
        const responseData = [];
        for (let date = startDate.clone(); date.isSameOrBefore(endDate); date.add(1, 'days')) {
            const formattedDate = date.format('YYYY-MM-DD');
            responseData.push({
                date: formattedDate,
                Dedupe: resultsMap[formattedDate]?.Dedupe || 0,
                'Create Failed': resultsMap[formattedDate]?.['Create Failed'] || 0,
                Rejected: resultsMap[formattedDate]?.Rejected || 0,
                'In-Progress': resultsMap[formattedDate]?.['In-Progress'] || 0,
                Disbursed: resultsMap[formattedDate]?.Disbursed || 0
            });
        }

        // Sort the responseData array in descending order by date
        responseData.sort((a, b) => moment(b.date).diff(moment(a.date)));

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error fetching lender leads:', error);
        res.status(500).json({
            status: 'failure',
            message: 'Internal server error',
            errors: [{ message: error.message }]
        });
    }
};