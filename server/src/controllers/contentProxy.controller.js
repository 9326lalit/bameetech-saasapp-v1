const { Plan, Subscription, ContentAccess, User } = require('../models');
const axios = require('axios');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Generate secure access token
const generateAccessToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate temporary access token for content
const generateContentAccessToken = async (req, res) => {
  try {
    const { planId, contentId } = req.body;
    const userId = req.user.id;

    // Check if user has active subscription for this plan
    const subscription = await Subscription.findOne({
      where: {
        userId,
        planId,
        status: 'active',
        endDate: {
          [Op.gt]: new Date() // Subscription not expired
        }
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found for this plan'
      });
    }

    // Get plan details
    const plan = await Plan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if content exists in plan
    const content = plan.contentUrls.find(c => c.id === contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found in this plan'
      });
    }

    // Generate access token (valid for 1 hour)
    const accessToken = generateAccessToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store access token
    await ContentAccess.create({
      userId,
      planId,
      contentId,
      accessToken,
      expiresAt,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });


    // Return proxy URL
    const proxyUrl = `${req.protocol}://${req.get('host')}/api/api/content/view/${accessToken}`;

    res.status(200).json({
      success: true,
      proxyUrl,
      expiresAt,
      contentTitle: content.title
    });

  } catch (error) {
    console.error('Error generating access token:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating access token',
      error: error.message
    });
  }
};

// View protected content (proxy endpoint)
const viewProtectedContent = async (req, res) => {
  try {
    const { token } = req.params;

    // Find and validate access token
    const access = await ContentAccess.findOne({
      where: {
        accessToken: token,
        expiresAt: {
          [Op.gt]: new Date() // Token not expired
        }
      },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'email', 'name']
        },
        {
          model: Plan,
          as: 'Plan'
        }
      ]
    });

    if (!access) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Access Denied</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            h1 { color: #e53e3e; margin-bottom: 20px; }
            p { color: #4a5568; margin-bottom: 30px; }
            a {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              transition: background 0.3s;
            }
            a:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔒 Access Denied</h1>
            <p>This content link has expired or is invalid.<br>Please request a new access link from your dashboard.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    // Validate IP address to prevent link sharing (can be disabled via env variable)
    const enforceIpValidation = process.env.ENFORCE_IP_VALIDATION !== 'false'; // Default: true
    
    if (enforceIpValidation) {
      const currentIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const originalIp = access.ipAddress;
      
      // Normalize IPs (handle IPv6 localhost variations)
      const normalizeIp = (ip) => {
        if (!ip) return '';
        // Convert ::1 and ::ffff:127.0.0.1 to 127.0.0.1
        if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
        if (ip.startsWith('::ffff:')) return ip.substring(7);
        return ip;
      };

      const normalizedCurrentIp = normalizeIp(currentIp);
      const normalizedOriginalIp = normalizeIp(originalIp);

      if (normalizedCurrentIp !== normalizedOriginalIp) {
      
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Access Denied</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            h1 { color: #e53e3e; margin-bottom: 20px; }
            p { color: #4a5568; margin-bottom: 30px; line-height: 1.6; }
            .warning {
              background: #fed7d7;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              font-size: 14px;
            }
            a {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              transition: background 0.3s;
            }
            a:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚫 Access Denied</h1>
            <p>This content link cannot be shared.</p>
            <div class="warning">
              <strong>Security Notice:</strong><br>
              This link is tied to your device and cannot be accessed from a different location or device.
              If you need to access this content, please generate a new link from your dashboard.
            </div>
            <p>Each user must access content through their own account for security and licensing purposes.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/protected-content">Get Your Own Link</a>
          </div>
        </body>
        </html>
      `);
      }
    }

    // Check if user's subscription is still active
    const subscription = await Subscription.findOne({
      where: {
        userId: access.userId,
        planId: access.planId,
        status: 'active',
        endDate: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!subscription) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Subscription Expired</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            h1 { color: #e53e3e; margin-bottom: 20px; }
            p { color: #4a5568; margin-bottom: 30px; }
            a {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              transition: background 0.3s;
              margin: 5px;
            }
            a:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏰ Subscription Expired</h1>
            <p>Your subscription has expired.<br>Please renew to continue accessing this content.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/plans">View Plans</a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard">Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    // Get content details from plan
    const content = access.Plan.contentUrls.find(c => c.id === access.contentId);
    if (!content) {
      return res.status(404).send('Content not found');
    }

    // Update access tracking
    await access.update({
      lastAccessedAt: new Date(),
      accessCount: access.accessCount + 1
    });


    // Fetch WordPress content with or without password
    try {
      let contentResponse;

      // Common headers to mimic a real browser
      const browserHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      };

      // Check if content requires password
      if (content.password && content.password.trim() !== '') {
        // Create form data for WordPress password submission
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('post_password', content.password);
        formData.append('Submit', 'Enter');

        // First request: Submit password to get cookie
        const passwordResponse = await axios.post(content.url, formData, {
          headers: {
            ...formData.getHeaders(),
            ...browserHeaders
          },
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
          timeout: 30000 // 30 second timeout
        });

        // Extract cookies
        const cookies = passwordResponse.headers['set-cookie'];
        
        // Second request: Get actual content with cookie
        contentResponse = await axios.get(content.url, {
          headers: {
            ...browserHeaders,
            'Cookie': cookies ? cookies.join('; ') : '',
            'Referer': content.url
          },
          timeout: 30000
        });
      } else {
        // No password required - direct fetch
        contentResponse = await axios.get(content.url, {
          headers: browserHeaders,
          timeout: 30000
        });
      }

      let html = contentResponse.data;

      // Add watermark with user info
      const watermark = `
        <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 8px 15px; border-radius: 5px; font-size: 12px; z-index: 9999;">
          Licensed to: ${access.User.name} (${access.User.email})
        </div>
      `;

      // Inject watermark before closing body tag
      html = html.replace('</body>', `${watermark}</body>`);

      // Add meta tags to prevent indexing
      const metaTags = `
        <meta name="robots" content="noindex, nofollow">
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
        <meta http-equiv="Pragma" content="no-cache">
        <meta http-equiv="Expires" content="0">
      `;
      html = html.replace('</head>', `${metaTags}</head>`);

      // Send the content
      res.send(html);

    } catch (fetchError) {
      console.error('Error fetching WordPress content:', fetchError.message);
      console.error('Content URL:', content.url);
      console.error('Status code:', fetchError.response?.status);
      
      // Determine error message based on status code
      let errorMessage = fetchError.message;
      let errorDetails = '';
      
      if (fetchError.response?.status === 999) {
        errorMessage = 'The website is blocking automated access';
        errorDetails = 'This URL appears to be from a social media site (like LinkedIn) or a website that blocks automated requests. Please use a WordPress URL with password protection instead.';
      } else if (fetchError.response?.status === 404) {
        errorMessage = 'Content not found';
        errorDetails = 'The WordPress page does not exist or the URL is incorrect.';
      } else if (fetchError.response?.status === 403) {
        errorMessage = 'Access forbidden';
        errorDetails = 'The password may be incorrect or the page settings need to be updated.';
      }
      
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Content Unavailable</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 600px;
            }
            h1 { color: #e53e3e; margin-bottom: 20px; }
            p { color: #4a5568; margin-bottom: 20px; line-height: 1.6; }
            .error { 
              background: #fed7d7; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0;
              text-align: left;
            }
            .error strong { color: #c53030; }
            .info {
              background: #bee3f8;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              text-align: left;
              font-size: 14px;
            }
            a {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 10px;
            }
            a:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ Content Unavailable</h1>
            <p>We couldn't load the content at this time.</p>
            <div class="error">
              <strong>Error:</strong> ${errorMessage}
              ${errorDetails ? `<br><br>${errorDetails}` : ''}
            </div>
            ${fetchError.response?.status === 999 ? `
              <div class="info">
                <strong>💡 How to fix this:</strong><br>
                1. Use a WordPress website URL (not LinkedIn, Facebook, etc.)<br>
                2. Create a password-protected page in WordPress<br>
                3. Add that page's URL to your plan<br>
                4. Make sure the password matches what you set in WordPress
              </div>
            ` : ''}
            <p>Please contact support if the problem persists.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard">Back to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

  } catch (error) {
    console.error('Error viewing protected content:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          h1 { color: #e53e3e; }
          p { color: #4a5568; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Error</h1>
          <p>An unexpected error occurred. Please try again.</p>
        </div>
      </body>
      </html>
    `);
  }
};

// Get user's content access history
const getAccessHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.query;

    const whereClause = { userId };
    if (planId) {
      whereClause.planId = planId;
    }

    const accessHistory = await ContentAccess.findAll({
      where: whereClause,
      include: [
        {
          model: Plan,
          as: 'Plan',
          attributes: ['id', 'name']
        }
      ],
      order: [['lastAccessedAt', 'DESC']],
      limit: 50
    });

    res.status(200).json({
      success: true,
      accessHistory
    });

  } catch (error) {
    console.error('Error fetching access history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching access history',
      error: error.message
    });
  }
};

module.exports = {
  generateContentAccessToken,
  viewProtectedContent,
  getAccessHistory
};
