import axios from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { Plan, Subscription, ContentAccess, User } from '../models/index.js';

// Generate secure random access token
const generateAccessToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Generate temporary access token for a user to access content
 */
export const generateContentAccessToken = async (req, res) => {
  try {
    const { planId, contentId } = req.body;
    const userId = req.user.id;

    // Check active subscription
    const subscription = await Subscription.findOne({
      where: { userId, planId, status: 'active', endDate: { [Op.gt]: new Date() } }
    });
    if (!subscription) return res.status(403).json({ success: false, message: 'No active subscription found for this plan' });

    // Get plan & content
    const plan = await Plan.findByPk(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    const content = plan.contentUrls.find(c => c.id === contentId);
    if (!content) return res.status(404).json({ success: false, message: 'Content not found in this plan' });

    // Create access token
    const accessToken = generateAccessToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await ContentAccess.create({
      userId, planId, contentId, accessToken, expiresAt,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    const proxyUrl = `${req.protocol}://${req.get('host')}/api/api/content/view/${accessToken}?uid=${userId}`;

    // res.status(200).json({
    //   success: true, proxyUrl, expiresAt,
    //   contentTitle: content.title, password: content.password || null
    // });
    // Return to frontend
res.status(200).json({
  success: true,
  proxyUrl,          // frontend will append ?uid=
  expiresAt,
  contentTitle: content.title,
  password: content.password || null
});


  } catch (err) {
    console.error('Error generating access token:', err);
    res.status(500).json({ success: false, message: 'Error generating access token', error: err.message });
  }
};

/**
 * View protected content via proxy
 */
export const viewProtectedContent = async (req, res) => {
  try {
    const { token } = req.params;
    const { uid } = req.query;

    // Validate access token
    const tokenData = await ContentAccess.findOne({ 
      where: { 
        accessToken: token, 
        expiresAt: { [Op.gt]: new Date() } 
      },
      include: [
        { model: Plan, as: 'Plan' }
      ]
    });

    if (!tokenData) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Access Denied</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 500px; }
            h1 { color: #e53e3e; margin-bottom: 20px; }
            p { color: #4a5568; margin-bottom: 30px; }
            a { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; transition: background 0.3s; }
            a:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔒 Access Denied</h1>
            <p>This content link has expired or is invalid.<br>Please request a new access link from your dashboard.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/protected-content">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    // Validate user ID
    if (uid && tokenData.userId.toString() !== uid) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Unauthorized</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 500px; }
            h1 { color: #e53e3e; margin-bottom: 20px; }
            p { color: #4a5568; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚫 Unauthorized Access</h1>
            <p>This link is not for your account.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Get user details
    const user = await User.findByPk(tokenData.userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Get content from plan
    const plan = tokenData.Plan;
    if (!plan || !plan.contentUrls) {
      return res.status(404).send("Content not found");
    }

    const content = plan.contentUrls.find(c => c.id === tokenData.contentId);
    if (!content) {
      return res.status(404).send("Content not found in plan");
    }

    // Browser headers to mimic real browser
    const browserHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };

    // Submit password if exists
    let cookies = [];
    if (content.password && content.password.trim() !== '') {
      try {
        const form = new FormData();
        form.append('post_password', content.password);
        form.append('Submit', 'Enter');

        const passRes = await axios.post(content.url, form, {
          headers: { ...form.getHeaders(), ...browserHeaders },
          maxRedirects: 5,
          validateStatus: status => status >= 200 && status < 400,
          timeout: 30000
        });

        cookies = passRes.headers['set-cookie'] || [];
      } catch (passError) {
        console.error('Password submission error:', passError.message);
      }
    }

    // Fetch the actual page
    const pageRes = await axios.get(content.url, {
      headers: { 
        ...browserHeaders, 
        Cookie: cookies.join('; '),
        Referer: content.url
      },
      timeout: 30000
    });

    let html = pageRes.data;

    // Inject watermark
    const watermark = `
      <div style="position:fixed;bottom:10px;right:10px;background:rgba(0,0,0,0.8);color:white;padding:8px 15px;font-size:12px;z-index:9999;border-radius:5px;box-shadow:0 2px 10px rgba(0,0,0,0.3);">
        Licensed to: ${user.name} (${user.email})
      </div>
    `;
    html = html.replace('</body>', watermark + '</body>');

    // Inject auto password-fill for WordPress (if password protected)
    if (content.password && content.password.trim() !== '') {
      const autoFillScript = `
      <script>
        (function() {
          document.addEventListener("DOMContentLoaded", function () {
            const pass = "${content.password.replace(/"/g, '\\"')}";
            const input = document.querySelector("input[name='post_password']");
            const form = document.querySelector("form.post-password-form");
            if (input && form) {
              input.value = pass;
              setTimeout(() => form.submit(), 100);
            }
          });
        })();
      </script>`;
      html = html.replace('</body>', autoFillScript + '</body>');
    }

    // Add meta tags to prevent indexing
    const metaTags = `
      <meta name="robots" content="noindex,nofollow">
      <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
      <meta http-equiv="Pragma" content="no-cache">
      <meta http-equiv="Expires" content="0">
    `;
    html = html.replace('</head>', metaTags + '</head>');

    // Update access tracking
    await tokenData.update({
      lastAccessedAt: new Date(),
      accessCount: (tokenData.accessCount || 0) + 1
    });

    res.send(html);

  } catch (err) {
    console.error("Error fetching protected content:", err);
    
    let errorMessage = 'Failed to load content.';
    if (err.response?.status === 404) {
      errorMessage = 'The WordPress page was not found. Please check the URL.';
    } else if (err.response?.status === 403) {
      errorMessage = 'Access to the WordPress page was forbidden. Please check the password.';
    } else if (err.code === 'ECONNREFUSED') {
      errorMessage = 'Could not connect to the WordPress site.';
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = 'Connection to WordPress site timed out.';
    }

    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Content Unavailable</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; }
          .container { background: white; padding: 40px; border-radius: 10px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 600px; }
          h1 { color: #e53e3e; margin-bottom: 20px; }
          p { color: #4a5568; margin-bottom: 20px; line-height: 1.6; }
          .error { background: #fed7d7; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left; }
          .error strong { color: #c53030; }
          a { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
          a:hover { background: #5568d3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Content Unavailable</h1>
          <p>We couldn't load the content at this time.</p>
          <div class="error">
            <strong>Error:</strong> ${errorMessage}
          </div>
          <p>Please contact support if the problem persists.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/protected-content">Back to Dashboard</a>
        </div>
      </body>
      </html>
    `);
  }
};

/**
 * Get user's content access history
 */
export const getAccessHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.query;

    const whereClause = { userId };
    if (planId) whereClause.planId = planId;

    const accessHistory = await ContentAccess.findAll({
      where: whereClause,
      include: [{ model: Plan, as: 'Plan', attributes: ['id', 'name'] }],
      order: [['lastAccessedAt', 'DESC']],
      limit: 50
    });

    res.status(200).json({ success: true, accessHistory });

  } catch (err) {
    console.error('Error fetching access history:', err);
    res.status(500).json({ success: false, message: 'Error fetching access history', error: err.message });
  }
};
