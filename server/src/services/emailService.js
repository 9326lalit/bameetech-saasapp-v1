const nodemailer = require('nodemailer');
require('dotenv').config();

// Verify nodemailer is loaded correctly
if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
  console.error('❌ Nodemailer not loaded correctly!');
  throw new Error('Nodemailer module not found or invalid');
}

// Create transporter (note: it's createTransport, not createTransporter)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use App Password, not regular password
    },
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password, not regular password
      },
    });
    
    const purposeText = {
      signup: 'Sign Up',
      login: 'Login',
      password_reset: 'Password Reset'
    };
    
    const mailOptions = {
      from: `"BameeTech SaaS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your ${purposeText[purpose]} OTP - BameeTech`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .otp-box {
              background: white;
              border: 2px dashed #667eea;
              border-radius: 10px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              margin: 10px 0;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verification Code</h1>
              <p>BameeTech SaaS Platform</p>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>You requested a verification code for <strong>${purposeText[purpose]}</strong>.</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Your OTP Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; color: #6b7280; font-size: 12px;">Valid for 10 minutes</p>
              </div>
              
              <p>Enter this code to complete your ${purposeText[purpose].toLowerCase()}.</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Never share this code with anyone</li>
                  <li>BameeTech will never ask for your OTP</li>
                  <li>This code expires in 10 minutes</li>
                </ul>
              </div>
              
              <p>If you didn't request this code, please ignore this email or contact support if you're concerned about your account security.</p>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} BameeTech SaaS. All rights reserved.</p>
                <p>This is an automated email, please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };
    
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"BameeTech SaaS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to BameeTech SaaS! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to BameeTech!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name}!</h2>
              <p>Thank you for joining BameeTech SaaS Platform. We're excited to have you on board!</p>
              <p>You can now:</p>
              <ul>
                <li>Browse and subscribe to plans</li>
                <li>Access exclusive lead databases</li>
                <li>Manage your subscriptions</li>
                <li>Export and analyze leads</li>
              </ul>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Get Started</a>
              </p>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The BameeTech Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't throw error for welcome email, it's not critical
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
};
