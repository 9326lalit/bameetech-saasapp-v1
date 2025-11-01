// const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Payment, Subscription, Plan, User } = require('../models');
require('dotenv').config();

// Commented out for testing
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    
    // Get plan details
    const plan = await Plan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Mock Razorpay order for testing
    const mockOrder = {
      id: `order_${Date.now()}`,
      amount: Math.round(plan.price * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
    
    res.status(200).json({
      message: 'Order created successfully',
      order: mockOrder,
      key_id: 'test_key_id',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    
    // Skip signature verification for testing
    
    // Get plan details
    const plan = await Plan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Create subscription
    const subscription = await Subscription.create({
      userId,
      planId,
      startDate: new Date(),
      endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
      status: 'active',
    });
    
    // Create payment record
    const payment = await Payment.create({
      userId,
      planId,
      subscriptionId: subscription.id,
      amount: plan.price,
      paymentId: `test_payment_${Date.now()}`,
      orderId: `test_order_${Date.now()}`,
      status: 'success',
    });
    
    res.status(200).json({
      message: 'Payment successful',
      subscription,
      payment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};

const handleWebhook = async (req, res) => {
  // Simplified webhook handler for testing
  res.status(200).json({ received: true });
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
};