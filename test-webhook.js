/**
 * Test script for Elementor webhook endpoint
 * Run this to test lead collection without Elementor
 * 
 * Usage: node test-webhook.js
 */

const axios = require('axios');

const API_URL = 'http://147.79.71.235/api';

// Test data for different forms
const testLeads = [
  {
    form_key: 'insurance_leads',
    name: 'Rahul Patil',
    phone: '9876543210',
    email: 'rahul@example.com',
    city: 'Mumbai',
    insurance_type: 'Health Insurance',
    age: '35'
  },
  {
    form_key: 'car_loan_leads',
    name: 'Priya Sharma',
    phone: '9876543211',
    email: 'priya@example.com',
    city: 'Delhi',
    loan_amount: '500000',
    car_model: 'Honda City',
    employment_type: 'Salaried'
  },
  {
    form_key: 'real_estate_leads',
    name: 'Amit Kumar',
    phone: '9876543212',
    email: 'amit@example.com',
    city: 'Bangalore',
    property_type: '2BHK Apartment',
    budget: '5000000',
    preferred_location: 'Whitefield'
  }
];

async function testWebhook() {
  console.log('🧪 Testing Elementor Webhook Endpoint...\n');
  console.log(`📡 API URL: ${API_URL}/collect-lead\n`);
  
  for (const lead of testLeads) {
    try {
      console.log(`📤 Sending lead to table: ${lead.form_key}...`);
      console.log(`   Fields: ${Object.keys(lead).filter(k => k !== 'form_key').join(', ')}`);
      
      const response = await axios.post(`${API_URL}/collect-lead`, lead);
      
      if (response.data.success) {
        console.log(`✅ Success: Lead stored in table '${response.data.tableName}' with ID ${response.data.leadId}`);
      } else {
        console.log(`❌ Failed: ${response.data.message}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ Error: ${error.response.data.message || error.message}`);
      } else {
        console.log(`❌ Error: ${error.message}`);
        console.log(`   Make sure the server is running on ${API_URL}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('✅ Test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Check your database for new tables (insurance_leads, car_loan_leads, real_estate_leads)');
  console.log('2. Login as admin and go to Plan Management');
  console.log('3. Create/Edit a plan and select the lead tables');
  console.log('4. Subscribe to the plan and view leads');
  console.log('\n💡 Tip: You can add more fields to the forms and run this again to test dynamic column addition!');
}

// Run the test
testWebhook().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
