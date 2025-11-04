import nodemailer from "nodemailer";

export const sendMail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App password वापर Gmail साठी
      },
    });

    await transporter.sendMail({
      from: `"BameeTech Pvt.Ltd" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`📩 Email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Email send failed:", error);
  }
};
