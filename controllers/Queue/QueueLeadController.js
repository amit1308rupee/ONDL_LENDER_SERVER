const axios = require('axios');
const LenderStatus = require('../../models/LenderStatus');
const dotenv = require('dotenv');

dotenv.config();

exports.createLead = async (req) => {
    const { lender_name, lead_id } = req;

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
        console.log('Calling dedupe API...');
        const dedupeResponse = await axios.post(`${process.env.DEDUPE_API_URL}/api/v2/sublender/check-dedupe`, {
            mobile: mobile
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.AUTHORIZATION_HEADER
            }
        });
        console.log('Dedupe API response:', dedupeResponse.data);

        const dedupeData = dedupeResponse.data;

        // Save dedupe response
        await saveLenderStatus(lead_id, lender_name, 'check-dedupe', dedupeData);

        let createLeadResponseData;
        const dobString = partnerData?.lead?.dob;
        const dobDate = new Date(dobString);
        const formattedDob = dobDate.toISOString().split('T')[0];
        const email = partnerData?.lead?.personal_email
        if (dedupeData.statusCode === 1003) {
            // Prepare data for create lead API
            const createLeadData = {
                mobile: partnerData?.lead?.mobile,
                name: partnerData?.lead?.customer_name,
                pan: partnerData?.lead?.pancard,
                employmentType: partnerData?.lead?.salaried === 1 ? 'salaried' : 'selfEmployed',
                salary: partnerData?.lead?.monthly_income,
                dob: formattedDob,
                pincode: parseInt(partnerData?.current_address?.pincode, 10),
                gender:  partnerData?.lead?.gender?.toLowerCase(),
                email:"",
                permanentAddress: `${partnerData?.permanent_address?.address_line_1}, ${partnerData?.permanent_address?.address_line_2}, ${partnerData?.permanent_address?.city}, ${partnerData?.permanent_address?.state}, ${partnerData?.permanent_address?.pincode}`,
                companyName: partnerData?.company_name || '',
                companyAddress: partnerData?.company_address || '',
                modeOfSalary: partnerData?.mode_of_salary || ''
            };

            console.log('Create Lead payload:', createLeadData);

            // Call the create lead API
            console.log('Calling create lead API...');
            const createLeadResponse = await axios.post(`${process.env.CREATE_LEAD_API_URL}/api/v2/sublender/create-lead`, createLeadData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.AUTHORIZATION_HEADER
                }
            });
            console.log('Create lead API response:', createLeadResponse.data);

            createLeadResponseData = createLeadResponse.data;

            // Save create lead response
            await saveLenderStatus(lead_id, lender_name, 'create-lead', createLeadResponseData);
        }

        res.status(200).json({
            status: 'success',
            message: 'Process completed successfully',
            data: [
                {
                    "Dedupe-Check": dedupeData,
                    "Create-Lead": createLeadResponseData || null
                }
            ],
            errors: []
        });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({
            status: 'failure',
            message: 'Internal server error',
            data: null,
            errors: [{ message: error.message }]
        });
    }
};

const saveLenderStatus = async (lead_id, lender_name, api_name, responseData) => {
    console.log('Saving lender status...');
    for (const [key, value] of Object.entries(responseData)) {
        const lenderStatus = new LenderStatus({
            lead_id,
            lender_name,
            api_name,
            parameter_name: key,
            parameter_value: value
        });
        await lenderStatus.save();
        console.log(`Saved lender status for ${key}: ${value}`);
    }
};