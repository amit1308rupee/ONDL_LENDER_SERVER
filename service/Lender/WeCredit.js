const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const path = require('path');
const { saveLenderStatus } = require('../../models/LenderStatusModel');
const { publishMessage } = require('../../service/message');

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

exports.processWeCreditLead = async (partnerData, lead_id, lender_name) => {
    try {
        const mobile = partnerData.lead.mobile;

        // Call the dedupe API
        const dedupeData = await exports.callDedupeAPI(mobile, lead_id, lender_name);

        // Save dedupe response
        await saveLenderStatus(lead_id, lender_name, 'check-dedupe', dedupeData);

        let createLeadResponseData;
        if (dedupeData.statusCode === 1003) {
            // Call the create lead API
            createLeadResponseData = await exports.callCreateLeadAPI(partnerData, lead_id, lender_name);

            // Save create lead response
            await saveLenderStatus(lead_id, lender_name, 'create-lead', createLeadResponseData);


            if (createLeadResponseData.statusCode === 2003) {

                // Queue Message
                const queueMessage = {
                    lead_id: lead_id,
                    lender_name: lender_name,
                    status: "Lead Created",
                    status_code: createLeadResponseData.statusCode
                };
                const createQueueMessage = {
                    lender_accepted: true,
                    lender_name: lender_name,
                    lead_id: lead_id,
                    partner_Data:extractLeadData(partnerData?.lead)
                }
                try {
                    console.log('Before publishMessage - Lender_Partner');
                    await publishMessage("Lender_Partner", "lead", queueMessage);
                    console.log('After publishMessage - Lender_Partner');
                    await publishMessage("Lender_Bre", "lead", createQueueMessage);
                    console.log('After publishMessage - Lender_Bre');
                } catch (error) {
                    console.error('Error from Lender_Partner:', error);
                }
            } else {
                const dedupeQueueMessage = {
                    lender_accepted: false,
                    lender_name: lender_name,
                    lead_id: lead_id,
                    partner_Data:extractLeadData(partnerData?.lead)
                }
                try {
                    await publishMessage("Lender_Bre", "lead", dedupeQueueMessage);
                    console.log('After publishMessage - Lender_Bre');
                } catch (error) {
                    console.error('Error from Lender_Bre:', error);
                }
            }
        } else {
            const dedupeQueueMessage = {
                lender_accepted: false,
                lender_name: lender_name,
                lead_id: lead_id,
                partner_Data:extractLeadData(partnerData?.lead)
            }
            try {
                await publishMessage("Lender_Bre", "lead", dedupeQueueMessage);
                console.log('After publishMessage - Lender_Bre');
            } catch (error) {
                console.error('Error from Lender_Bre:', error);
            }
        }

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
        console.log('Process completed successfully', response);

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

exports.callDedupeAPI = async (mobile, lead_id, lender_name) => {
    try {
        console.log('Calling dedupe API...');
        const dedupeResponse = await axios.post(`${process.env.WECREDIT_DEDUPE_API_URL}/api/v2/sublender/check-dedupe`, {
            mobile: mobile
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.WECREDIT_AUTHORIZATION_HEADER
            }
        });
        console.log('Dedupe API response:', dedupeResponse.data);

        // Log response
        logResponse('Dedupe API Response', {
            status: 'success',
            message: 'Dedupe API called successfully',
            data: dedupeResponse.data,
            lead_id,
            lender_name
        });

        return dedupeResponse.data;
    } catch (error) {
        console.error('Error calling dedupe API:', error);

        // Log error response
        logResponse('Error Calling Dedupe API', {
            status: 'failure',
            message: 'Error calling dedupe API',
            data: null,
            errors: [{ message: error.message }],
            lead_id,
            lender_name
        });

        throw error;
    }
};

exports.callCreateLeadAPI = async (partnerData, lead_id, lender_name) => {
    try {
        const dobString = partnerData?.lead?.dob;
        const dobDate = new Date(dobString);
        const formattedDob = dobDate.toISOString().split('T')[0];

        const createLeadData = {
            mobile: partnerData?.lead?.mobile,
            name: partnerData?.lead?.customer_name,
            pan: partnerData?.lead?.pancard,
            employmentType: partnerData?.lead?.salaried === 1 ? 'salaried' : 'selfEmployed',
            salary: partnerData?.lead?.monthly_income,
            dob: formattedDob,
            pincode: parseInt(partnerData?.current_address?.pincode, 10),
            gender: partnerData?.lead?.gender?.toLowerCase() || "male",
            email: partnerData?.lead?.personal_email || "",
            permanentAddress: `${partnerData?.permanent_address?.address_line_1}, ${partnerData?.permanent_address?.address_line_2}, ${partnerData?.permanent_address?.city}, ${partnerData?.permanent_address?.state}, ${partnerData?.permanent_address?.pincode}`,
            companyName: partnerData?.company_name || '',
            companyAddress: partnerData?.company_address || '',
            modeOfSalary: partnerData?.mode_of_salary || ''
        };

        console.log('Create Lead payload:', createLeadData);

        console.log('Calling create lead API...');
        const createLeadResponse = await axios.post(`${process.env.WECREDIT_CREATE_LEAD_API_URL}/api/v2/sublender/create-lead`, createLeadData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.WECREDIT_AUTHORIZATION_HEADER
            }
        });
        console.log('Create lead API response:', createLeadResponse.data);

        // Log response
        logResponse('Create Lead API Response', {
            status: 'success',
            message: 'Create Lead API called successfully',
            data: createLeadResponse.data,
            lead_id,
            lender_name
        });

        return createLeadResponse.data;
    } catch (error) {
        console.error('Error calling create lead API:', error);

        // Log error response
        logResponse('Error Calling Create Lead API', {
            status: 'failure',
            message: 'Error calling create lead API',
            data: null,
            errors: [{ message: error.message }],
            lead_id,
            lender_name
        });

        throw error;
    }
};


function extractLeadData(leadData) {
    const dob = new Date(leadData.dob);
    let age = new Date().getFullYear() - dob.getFullYear();
    const monthDifference = new Date().getMonth() - dob.getMonth();
    const dayDifference = new Date().getDate() - dob.getDate();

    // Adjust age if the current date is before the birthday in the current year
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }

    return {
        pancard: leadData.pancard,
        name: leadData.customer_name,
        mobile: leadData.mobile,
        salary: leadData.monthly_income,
        age: age,
        pincode: leadData.current_address.pincode,
        lead_id: leadData.lead_id,
        current_address: leadData.current_address
    };
}