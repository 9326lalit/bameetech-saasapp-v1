// Test script for Hostinger email configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing Hostinger Email Configuration...\n');
  
  // Check if environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS not set in .env file');
    process.exit(1);
  }
  
  console.log('📧 Email Configuration:');
  console.log('   Email User:', process.env.EMAIL_USER);
  console.log('   Password:', process.env.EMAIL_PASS ? '✓ Set' : '✗ Not set');
  console.log('   SMTP Host:', process.env.EMAIL_HOST || 'smtp.hostinger.com');
  console.log('   SMTP Port:', process.env.EMAIL_PORT || '465');
  console.log('   Secure:', process.env.EMAIL_SECURE || 'true');
  console.log('');
  
  try {
    // Create transporter for Hostinger
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.EMAIL_PORT) || 465,
      secure: process.env.EMAIL_SECURE === 'true' || true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('📮 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');
    
    // Send test email
    console.log('📨 Sending test email...');
    const info = await transporter.sendMail({
      from: `"BameeTech" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: '✅ Test Email - BameeTech Lead Management Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              margin: 0;
              padding: 0;
              background-color: #f3f4f6;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .footer {
              background: #f9fafb;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
              padding: 25px;
              border-top: 1px solid #e5e7eb;
            }
            .info-box {
              background: #fff7ed;
              border-left: 4px solid #ea580c;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1 style="margin: 10px 0; font-size: 28px;">Email Configuration Successful!</h1>
              <p style="margin: 0; font-size: 16px; opacity: 0.95;">BameeTech Lead Management Platform</p>
            </div>
            <div class="content">
              <h2 style="color: #111827; margin-top: 0;">Congratulations!</h2>
              <p>Your Hostinger email configuration is working perfectly. This test email confirms that:</p>
              
              <div class="info-box">
                <ul style="margin: 10px 0; padding-left: 20px; color: #78350f;">
                  <li>SMTP connection is established</li>
                  <li>Authentication is successful</li>
                  <li>Email sending is operational</li>
                  <li>OTP and welcome emails will work correctly</li>
                </ul>
              </div>
              
              <p><strong>Configuration Details:</strong></p>
              <ul>
                <li><strong>Email:</strong> ${process.env.EMAIL_USER}</li>
                <li><strong>SMTP Host:</strong> ${process.env.EMAIL_HOST || 'smtp.hostinger.com'}</li>
                <li><strong>Port:</strong> ${process.env.EMAIL_PORT || '465'}</li>
                <li><strong>Secure:</strong> SSL/TLS Enabled</li>
                <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
              </ul>
              
              <p style="margin-top: 30px;">Your application is now ready to send:</p>
              <ul>
                <li>OTP verification emails</li>
                <li>Welcome emails for new users</li>
                <li>Subscription notifications</li>
                <li>Any other transactional emails</li>
              </ul>
            </div>
            <div class="footer">
              <p style="margin: 5px 0;"><strong>BameeTech</strong> - Lead Management Platform</p>
              <p style="margin: 5px 0;">© ${new Date().getFullYear()} BameeTech. All rights reserved.</p>
              <p style="margin: 5px 0; font-size: 12px;">This is an automated test email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📨 Response:', info.response);
    console.log('\n🎉 All tests passed! Your Hostinger email configuration is working perfectly.');
    console.log('💡 You can now use team@bameetech.in for all application emails.');
    
  } catch (error) {
    console.error('\n❌ Email test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Please check:');
      console.error('   1. EMAIL_USER is correct: team@bameetech.in');
      console.error('   2. EMAIL_PASS is correct: Team@Pune#12');
      console.error('   3. Email account is active in Hostinger');
      console.error('   4. SMTP is enabled for this email account');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n💡 Connection failed. Please check:');
      console.error('   1. Your internet connection');
      console.error('   2. Firewall is not blocking port 465');
      console.error('   3. SMTP host is correct: smtp.hostinger.com');
    } else if (error.code === 'ESOCKET') {
      console.error('\n💡 Socket error. Try using port 587 with STARTTLS instead:');
      console.error('   Update .env file:');
      console.error('   EMAIL_PORT=587');
      console.error('   EMAIL_SECURE=false');
    }
    
    console.error('\n📋 Full error details:');
    console.error(error);
    
    process.exit(1);
  }
}

testEmail();
