// Quick test script to verify email service
require('dotenv').config();
const { sendOTPEmail } = require('./src/services/emailService');

async function testEmail() {
  console.log('🧪 Testing Email Service...\n');
  
  console.log('📧 Email Configuration:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER);
  console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not Set');
  console.log('');
  
  try {
    console.log('📤 Sending test OTP email...');
    const testOTP = '123456';
    const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
    
    await sendOTPEmail(testEmail, testOTP, 'login');
    
    console.log('✅ Email sent successfully!');
    console.log('📬 Check your inbox:', testEmail);
    console.log('');
    console.log('🎉 Email service is working correctly!');
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check EMAIL_USER and EMAIL_PASSWORD in .env');
    console.error('2. Ensure you are using Gmail App Password (not regular password)');
    console.error('3. Enable 2FA on Gmail: https://myaccount.google.com/security');
    console.error('4. Generate App Password: https://myaccount.google.com/apppasswords');
  }
}

testEmail();
