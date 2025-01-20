const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

exports.callDedupeAPI = async (mobile) => {
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
        return dedupeResponse.data;
    } catch (error) {
        console.error('Error calling dedupe API:', error);
        throw error;
    }
};

exports.callCreateLeadAPI = async (partnerData) => {
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
            email:  partnerData?.lead?.personal_email || "",
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
        return createLeadResponse.data;
    } catch (error) {
        console.error('Error calling create lead API:', error);
        throw error;
    }
};