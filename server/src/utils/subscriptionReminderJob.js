import cron from "node-cron";
import { sendMail } from "./sendMail.js";
import Subscription from "../models/subscription.model.js";

export const subscriptionReminderJob = () => {
  // ⏰ दररोज सकाळी 10 वाजता चालेल
  cron.schedule("0 10 * * *", async () => {
    console.log("🕒 Running subscription reminder job...");

    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // active plans ज्यांचा endDate पुढच्या 3 दिवसात येतो
    const expiringSubscriptions = await Subscription.find({
      status: "active",
      endDate: { $gte: now, $lte: threeDaysLater },
    }).populate("userId");

    for (const sub of expiringSubscriptions) {
      const user = sub.userId;

      const subject = `Your plan expires in 3 days ⏰`;
      const html = `
        <h2>Hi ${user.name},</h2>
        <p>Your <strong>${sub.planName}</strong> plan will expire on <strong>${sub.endDate.toDateString()}</strong>.</p>
        <p>Please renew soon to continue uninterrupted access.</p>
        <a href="https://yourfrontend.com/pricing" 
           style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">
          Renew Now
        </a>
        <p>Thanks,<br/>SkillLiftAI Team</p>
      `;

      await sendMail(user.email, subject, html);
    }

    console.log(`✅ Reminder job completed for ${expiringSubscriptions.length} users.`);
  });
};
