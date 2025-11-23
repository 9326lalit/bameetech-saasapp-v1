const { OTP, User } = require('../models');
const { sendOTPEmail } = require('../services/emailService');
const { Op } = require('sequelize');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
const sendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    
    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Email and purpose are required'
      });
    }
    
    // Validate purpose
    if (!['signup', 'login', 'password_reset'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purpose'
      });
    }
    
    // For login, check if user exists
    if (purpose === 'login') {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email'
        });
      }
    }
    
    // For signup, check if user already exists
    if (purpose === 'signup') {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }
    }
    
    // Check for recent OTP requests (rate limiting)
    const recentOTP = await OTP.findOne({
      where: {
        email,
        purpose,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 60000) // Last 1 minute
        }
      }
    });
    
    if (recentOTP) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 1 minute before requesting another OTP'
      });
    }
    
    // Invalidate old OTPs for this email and purpose
    await OTP.update(
      { verified: true }, // Mark as used
      {
        where: {
          email,
          purpose,
          verified: false
        }
      }
    );
    
    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Save OTP to database
    await OTP.create({
      email,
      otp,
      purpose,
      expiresAt,
      verified: false,
      attempts: 0
    });
    
    // Send OTP email
    await sendOTPEmail(email, otp, purpose);
    
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      expiresIn: 600 // seconds
    });
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;
    
    if (!email || !otp || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and purpose are required'
      });
    }
    
    // Find OTP
    const otpRecord = await OTP.findOne({
      where: {
        email,
        purpose,
        verified: false,
        expiresAt: {
          [Op.gt]: new Date() // Not expired
        }
      },
      order: [['createdAt', 'DESC']] // Get the latest OTP
    });
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    // Check attempts
    if (otpRecord.attempts >= 5) {
      await otpRecord.update({ verified: true }); // Invalidate after too many attempts
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP'
      });
    }
    
    // Verify OTP
    if (otpRecord.otp !== otp) {
      await otpRecord.increment('attempts');
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP',
        attemptsLeft: 5 - (otpRecord.attempts + 1)
      });
    }
    
    // Mark OTP as verified
    await otpRecord.update({ verified: true });
    
    
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  // Reuse sendOTP logic
  return sendOTP(req, res);
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
};
