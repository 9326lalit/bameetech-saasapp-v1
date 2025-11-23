// utils/sendInvoiceMail.js
const nodemailer = require("nodemailer");

const sendInvoiceMail = async (user, plan, subscription, payment) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"BameeTech Pvt.Ltd" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `✅ Payment Successful - ${plan.name} Plan Activated`,
      html: `
      <div style="font-family: Arial, sans-serif; background-color:#f6f8fb; padding:20px;">
        <div style="max-width:600px; background:white; margin:auto; border-radius:10px; overflow:hidden;">
          <div style="background:#4F46E5; color:white; text-align:center; padding:15px 0;">
            <h2>Payment Confirmation</h2>
          </div>
          <div style="padding:20px;">
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Thank you for your payment! Your <strong>${plan.name}</strong> plan has been successfully activated.</p>
            <hr/>
            <h3>🧾 Payment Details</h3>
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;">Plan:</td>
                <td><strong>${plan.name}</strong></td>
              </tr>
              <tr>
                <td>Duration:</td>
                <td><strong>${plan.duration} Days</strong></td>
              </tr>
              <tr>
                <td>Amount:</td>
                <td><strong>₹${plan.price}</strong></td>
              </tr>
              <tr>
                <td>Payment ID:</td>
                <td>${payment.paymentId}</td>
              </tr>
              <tr>
                <td>Order ID:</td>
                <td>${payment.orderId}</td>
              </tr>
              <tr>
                <td>Subscription Start:</td>
                <td>${new Date(subscription.startDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td>Subscription End:</td>
                <td>${new Date(subscription.endDate).toLocaleDateString()}</td>
              </tr>
            </table>
            <hr/>
            <p style="margin-top:15px;">You can now enjoy all premium features. 🎉</p>
            <p>If you have any questions, feel free to reply to this email.</p>
            <div style="text-align:center; margin-top:20px;">
              <a href="https://yourwebsite.com/dashboard" 
                 style="background:#4F46E5; color:white; padding:10px 20px; border-radius:6px; text-decoration:none;">Go to Dashboard</a>
            </div>
          </div>
          <div style="background:#f1f1f1; text-align:center; padding:10px; font-size:12px; color:#777;">
            <p>© ${new Date().getFullYear()} SkillLift AI. All rights reserved.</p>
          </div>
        </div>
      </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("❌ Error sending invoice email:", err.message);
  }
};

module.exports = sendInvoiceMail;
