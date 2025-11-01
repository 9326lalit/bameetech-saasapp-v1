const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get all payments
// controllers/payments.js
const getAllPayments = async (req, res) => {
  try {
    const payments = await razorpay.payments.all({ count: 50 });

    // Calculate total revenue
    const totalRevenue = payments.items.reduce((sum, payment) => {
      if (payment.status === 'captured') {
        return sum + payment.amount; // amount is in paise
      }
      return sum;
    }, 0);

    res.json({
      totalRevenue: totalRevenue / 100, // convert paise to INR
      payments: payments.items,
    });
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: 'Error fetching payments', error: err.message });
  }
};


// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await razorpay.orders.all({ count: 50 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
};

// Get subscriptions (if using recurring plans)
const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await razorpay.subscriptions.all({ count: 50 });
    res.json(subscriptions);
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({ message: 'Error fetching subscriptions', error: err.message });
  }
};

module.exports = {
  getAllPayments,
  getAllOrders,
  getAllSubscriptions,
};
