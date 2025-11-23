
// controllers/subscriptionController.js
const Razorpay = require('razorpay');
const { Op } = require('sequelize');

const crypto = require('crypto');
const { Plan, Subscription, Payment, User } = require('../models');
const { get } = require('http');
const sendInvoiceMail = require('../utils/sendInvoiceMail');
require('dotenv').config();
const nodemailer = require("nodemailer");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1️⃣ Create Razorpay Order API
const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    const plan = await Plan.findByPk(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const order = await razorpay.orders.create({
      amount: Math.round(plan.price * 100),
      currency: 'INR',
      receipt: `rec_${Date.now()}`,
      notes: { planId, userId },
    });

    res.status(200).json({ message: 'Order created', order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};


const verifyPayment = async (req, res) => {
  try {
    const { planId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    // 1️⃣ Verify Signature
    const hash = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (hash !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature, payment failed" });
    }

    // 2️⃣ Check Existing Active Subscription
    const existing = await Subscription.findOne({
      where: { userId, planId, status: "active", endDate: { [Op.gte]: new Date() } },
    });

    if (existing)
      return res.status(400).json({ message: "You already have an active subscription for this plan" });

    // 3️⃣ Create Subscription
    const plan = await Plan.findByPk(planId);
    const user = await User.findByPk(userId);

    const start = new Date();
    const end = new Date(start.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      userId,
      planId,
      startDate: start,
      endDate: end,
      status: "active",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: plan.price,
    });

    // 4️⃣ Save Payment Record
    const payment = await Payment.create({
      userId,
      planId,
      subscriptionId: subscription.id,
      amount: plan.price,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: "success",
    });

    // 5️⃣ Send Invoice Email
    await sendInvoiceMail(user, plan, subscription, payment);

    res.status(200).json({
      message: "Payment verified & subscription activated",
      subscription,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Error verifying payment", error: error.message });
  }
};



// 3️⃣ Razorpay Webhook - Server to Server
const handleWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest !== req.headers['x-razorpay-signature']) {
    return res.status(400).json({ status: 'invalid signature' });
  }

  console.log("✅ Webhook Verified");

  try {
    const event = req.body.event;

    console.log("event hit...",event)
    if (event === "payment.captured") {
      const paymentEntity = req.body.payload.payment.entity;

      const { order_id, id: paymentId, amount, notes } = paymentEntity;
      const userId = notes.userId;
      const planId = notes.planId;

      // Fetch Plan
      const plan = await Plan.findByPk(planId);

      if (!plan) return console.log("❌ Plan not found in DB");

      // Create subscription if not exists
      let subscription = await Subscription.findOne({
        where: {
          userId,
          planId,
          status: "active"
        }
      });

      const start = new Date();
const end = new Date(start.getTime() + plan.duration * 24 * 60 * 60 * 1000);

console.log('start:', start, 'end:', end);

// Optional: format as MySQL DATETIME
const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

      if (!subscription) {
        subscription = await Subscription.create({
          userId,
          planId,
          startDate: formatDate(start),
  endDate: formatDate(end),
          status: "active",
          orderId: razorpay_order_id,
  paymentId: razorpay_payment_id,
  amount: plan.price,
        });
      }

      console.log("subscription done...");
      // Store Payment
      await Payment.create({
        userId,
        planId,
        subscriptionId: subscription.id,
        amount: amount / 100, // convert paise to INR
        paymentId,
        orderId: order_id,
        status: "success"
      });
      console.log("✅ Payment & Subscription saved in DB");
    }

    res.status(200).json({ status: "ok" });

  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};


// ✅  Get Active Subscription
const getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gte]: new Date() }  // Valid subscription
      },
      include: [{ 
        model: Plan, 
        attributes: ['id', 'name', 'description', 'price', 'duration', 'contentUrls', 'htmlContent', 'documents', 'features'] 
      }]
    });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    // Add admin-granted flag and parse plan data
    const subscriptionData = {
      ...subscription.toJSON(),
      isAdminGranted: subscription.paymentId === 'admin_granted'
    };

    // Parse features if present
    if (subscriptionData.Plan && subscriptionData.Plan.features) {
      try {
        subscriptionData.Plan.features = typeof subscriptionData.Plan.features === 'string' 
          ? JSON.parse(subscriptionData.Plan.features) 
          : subscriptionData.Plan.features;
      } catch (e) {
        subscriptionData.Plan.features = [];
      }
    }

    // Ensure contentUrls is always an array
    if (subscriptionData.Plan && (!subscriptionData.Plan.contentUrls || !Array.isArray(subscriptionData.Plan.contentUrls))) {
      subscriptionData.Plan.contentUrls = [];
    }

    res.status(200).json({ message: "Active subscription fetched", subscription: subscriptionData });

  } catch (error) {
    res.status(500).json({ message: "Error fetching active subscription", error: error.message });
  }
};


// ✅  Get All Subscriptions (past + active)
const getAllUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await Subscription.findAll({
      where: { userId },
      order: [['startDate', 'DESC']],
      include: [{ 
        model: Plan, 
        attributes: ['id', 'name', 'description', 'price', 'duration', 'contentUrls', 'htmlContent', 'documents', 'features'] 
      }]
    });

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ message: "No subscriptions found" });
    }

    // Parse features for each plan
    const parsedSubscriptions = subscriptions.map(sub => {
      const subData = sub.toJSON();
      if (subData.Plan && subData.Plan.features) {
        try {
          subData.Plan.features = typeof subData.Plan.features === 'string' 
            ? JSON.parse(subData.Plan.features) 
            : subData.Plan.features;
        } catch (e) {
          subData.Plan.features = [];
        }
      }
      // Ensure contentUrls is always an array
      if (subData.Plan && (!subData.Plan.contentUrls || !Array.isArray(subData.Plan.contentUrls))) {
        subData.Plan.contentUrls = [];
      }
      return subData;
    });

    res.status(200).json({ message: "All subscriptions fetched", subscriptions: parsedSubscriptions });

  } catch (error) {
    res.status(500).json({ message: "Error fetching subscriptions", error: error.message });
  }
};


// ✅ Cancel Subscription API
const cancelSubscription = async (req, res) => {
  try {
    // ✅ Step 1: Validate input
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ message: "subscriptionId is required" });
    }

    // ✅ Step 2: Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    const userId = req.user.id;

    // ✅ Step 3: Check subscription exists for this user
    const subscription = await Subscription.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // ✅ Step 4: If Razorpay subscription exists, cancel there too
    if (subscription.razorpaySubscriptionId) {
      await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId);
    }

    // ✅ Step 5: Update status in DB
    subscription.status = "cancelled";
    subscription.endDate = new Date(); // Access stop now
    await subscription.save();

    console.log("✅ Subscription cancelled:", subscription);

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription,
    });
  } catch (error) {
    console.error("❌ Cancel subscription error:", error);
    res.status(500).json({
      message: "Error cancelling subscription",
      error: error.message,
    });
  }
};



module.exports = { createOrder, verifyPayment, handleWebhook , getUserSubscription, getAllUserSubscriptions , cancelSubscription };

