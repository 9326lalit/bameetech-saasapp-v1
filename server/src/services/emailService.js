const nodemailer = require('nodemailer');
require('dotenv').config();

// Verify nodemailer is loaded correctly
if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
  console.error('❌ Nodemailer not loaded correctly!');
  throw new Error('Nodemailer module not found or invalid');
}

// Create transporter for Hostinger SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE === 'true' || true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Do not fail on invalid certs (for development)
      rejectUnauthorized: false
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose) => {
  try {
    const transporter = createTransporter();
    
    const purposeText = {
      signup: 'Sign Up',
      login: 'Login',
      password_reset: 'Password Reset'
    };
    
    const mailOptions = {
      from: `"BameeTech" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your ${purposeText[purpose]} OTP - BameeTech`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
            .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .content {
              padding: 40px 30px;
            }
            .otp-box {
              background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
              border: 3px solid #ea580c;
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #ea580c;
              letter-spacing: 10px;
              margin: 15px 0;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              margin: 25px 0;
              border-radius: 6px;
            }
            .footer {
              background: #f9fafb;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
              padding: 25px;
              border-top: 1px solid #e5e7eb;
            }
            h2 {
              color: #111827;
              margin-top: 0;
            }
            .brand-name {
              color: #ea580c;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 BameeTech</div>
              <p style="margin: 0; font-size: 16px; opacity: 0.95;">Lead Management Platform</p>
            </div>
            <div class="content">
              <h2>Verification Required</h2>
              <p>Hello! You requested a verification code for <strong>${purposeText[purpose]}</strong> on <span class="brand-name">BameeTech</span>.</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #78716c; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; color: #78716c; font-size: 13px;">⏱️ Expires in 10 minutes</p>
              </div>
              
              <p>Enter this code in the verification screen to complete your ${purposeText[purpose].toLowerCase()}.</p>
              
              <div class="warning">
                <strong style="color: #92400e;">🔒 Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px; color: #78350f;">
                  <li>Never share this code with anyone</li>
                  <li>BameeTech staff will never ask for your OTP</li>
                  <li>This code is valid for 10 minutes only</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">If you're having trouble or didn't request this code, please contact our support team immediately.</p>
            </div>
            <div class="footer">
              <p style="margin: 5px 0;"><strong>BameeTech</strong> - Lead Management Platform</p>
              <p style="margin: 5px 0;">© ${new Date().getFullYear()} BameeTech. All rights reserved.</p>
              <p style="margin: 5px 0; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
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
      from: `"BameeTech" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to BameeTech! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
              padding: 50px 30px;
              text-align: center;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 8px;
              margin: 25px 0;
              font-weight: 600;
              box-shadow: 0 4px 6px rgba(234, 88, 12, 0.3);
            }
            .features {
              background: #fff7ed;
              border-radius: 8px;
              padding: 25px;
              margin: 25px 0;
            }
            .features ul {
              margin: 15px 0;
              padding-left: 25px;
            }
            .features li {
              margin: 10px 0;
              color: #78350f;
            }
            .footer {
              background: #f9fafb;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
              padding: 25px;
              border-top: 1px solid #e5e7eb;
            }
            h2 {
              color: #111827;
              margin-top: 0;
            }
            .brand-name {
              color: #ea580c;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎉 Welcome!</div>
              <h1 style="margin: 10px 0; font-size: 28px;">You're now part of BameeTech</h1>
              <p style="margin: 0; font-size: 16px; opacity: 0.95;">Lead Management Platform</p>
            </div>
            <div class="content">
              <h2>Hi ${name}!</h2>
              <p>Thank you for joining <span class="brand-name">BameeTech</span>. We're thrilled to have you on board and can't wait to help you grow your business with our powerful lead management tools.</p>
              
              <div class="features">
                <h3 style="color: #ea580c; margin-top: 0;">🚀 What you can do now:</h3>
                <ul>
                  <li><strong>Browse Plans</strong> - Explore our subscription options tailored to your needs</li>
                  <li><strong>Access Lead Databases</strong> - Get exclusive access to high-quality leads</li>
                  <li><strong>Manage Subscriptions</strong> - Full control over your active plans</li>
                  <li><strong>Export & Analyze</strong> - Download leads and track your growth</li>
                  <li><strong>Protected Content</strong> - Access premium resources and materials</li>
                </ul>
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Get Started Now →</a>
              </p>
              
              <p>If you have any questions or need assistance, our support team is here to help. Just reply to this email or reach out through your dashboard.</p>
              
              <p style="margin-top: 30px;">Best regards,<br><strong>The BameeTech Team</strong></p>
            </div>
            <div class="footer">
              <p style="margin: 5px 0;"><strong>BameeTech</strong> - Lead Management Platform</p>
              <p style="margin: 5px 0;">© ${new Date().getFullYear()} BameeTech. All rights reserved.</p>
              <p style="margin: 5px 0; font-size: 12px;">You're receiving this email because you created an account on BameeTech.</p>
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
