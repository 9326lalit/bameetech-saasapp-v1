const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Payment, Subscription, Plan, User } = require('../models');
const { Op } = require('sequelize');
require('dotenv').config();

// ✅ Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Order
const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    const plan = await Plan.findByPk(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const order = await razorpay.orders.create({
      amount: Math.round(plan.price * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { userId, planId },
    });

    res.status(200).json({
      success: true,
      message: 'Order created',
      order,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// ✅ Verify Payment & Activate Subscription
const verifyPayment = async (req, res) => {
  try {
    const { planId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    const plan = await Plan.findByPk(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // 🔒 Razorpay Signature Verification
    const hash = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (hash !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature, payment failed' });
    }

    // ✅ Prevent Duplicate Active Subscriptions
    const active = await Subscription.findOne({
      where: { userId, planId, status: 'active', endDate: { [Op.gte]: new Date() } },
    });
    if (active) return res.status(400).json({ message: 'You already have an active subscription' });

    // ✅ Subscription (Start & End Date)
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (plan.duration || 30) * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      userId,
      planId,
      startDate,
      endDate,
      status: 'active',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: plan.price,
    });

    // ✅ Save Payment
    await Payment.create({
      userId,
      planId,
      subscriptionId: subscription.id,
      amount: plan.price,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'captured', // ✅ Matches Razorpay (no ENUM issue now)
    });

    res.status(200).json({ message: 'Subscription activated', subscription });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};

// ✅ Get Total Revenue + Recent Payments
const getPaymentsAndStats = async (req, res) => {
  try {
    const payments = await Payment.findAll({ order: [['createdAt', 'DESC']] });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      totalRevenue,
      totalPayments: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

module.exports = { createOrder, verifyPayment, getPaymentsAndStats };
