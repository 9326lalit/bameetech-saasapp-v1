const { Plan, LeadDatabase } = require('../models');



const Razorpay = require('razorpay');
require('dotenv').config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createPlan = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, // assume in INR
      duration, // in months
      features, 
      leadDatabaseId,
      leadLimit,
      htmlContent 
    } = req.body;
    
    // Handle uploaded documents
    let documents = [];
    if (req.files && req.files.length > 0) {
      documents = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));
    }

    // 1️⃣ First, create in DB
    const plan = await Plan.create({
      name,
      description,
      price,
      duration,
      features,
      leadDatabaseId: leadDatabaseId || null,
      leadLimit: leadLimit || null,
      htmlContent: htmlContent || null,
      documents
    });

    // 2️⃣ Then, create Razorpay plan
    const razorpayPlan = await razorpay.plans.create({
      period: 'monthly', // या वेळी dynamic बनवू शकता duration check करून
      interval: duration || 1,
      item: {
        name,
        amount: price * 100, // ₹100 = 100 paisa
        currency: 'INR',
        description
      }
    });

    // 3️⃣ Save Razorpay plan ID to DB
    plan.razorpayPlanId = razorpayPlan.id;
    await plan.save();

    res.status(201).json({
      message: 'Plan created successfully',
      plan,
      razorpayPlan
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating plan', error: error.message });
  }
};


// const createPlan = async (req, res) => {
//   try {
//     const { 
//       name, 
//       description, 
//       price, 
//       duration, 
//       features, 
//       leadDatabaseId,
//       leadLimit,
//       htmlContent 
//     } = req.body;
    
//     // Handle uploaded documents
//     let documents = [];
//     if (req.files && req.files.length > 0) {
//       documents = req.files.map(file => ({
//         originalName: file.originalname,
//         filename: file.filename,
//         path: file.path,
//         size: file.size,
//         mimetype: file.mimetype
//       }));
//     }
    
//     const plan = await Plan.create({
//       name,
//       description,
//       price,
//       duration,
//       features,
//       leadDatabaseId: leadDatabaseId || null,
//       leadLimit: leadLimit || null,
//       htmlContent: htmlContent || null,
//       documents
//     });
    
//     res.status(201).json({
//       message: 'Plan created successfully',
//       plan,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating plan', error: error.message });
//   }
// };

const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({
      where: { isActive: true },
      include: [{
        model: LeadDatabase,
        attributes: ['id', 'name', 'description']
      }]
    });
    
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plans', error: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      duration, 
      features, 
      isActive,
      leadDatabaseId,
      leadLimit,
      htmlContent 
    } = req.body;
    
    const plan = await Plan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Handle uploaded documents
    let documents = plan.documents || [];
    if (req.files && req.files.length > 0) {
      const newDocuments = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));
      documents = [...documents, ...newDocuments];
    }
    
    await plan.update({
      name,
      description,
      price,
      duration,
      features,
      isActive,
      leadDatabaseId: leadDatabaseId || null,
      leadLimit: leadLimit || null,
      htmlContent: htmlContent || null,
      documents
    });
    
    res.status(200).json({
      message: 'Plan updated successfully',
      plan,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating plan', error: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plan = await Plan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    await plan.destroy();
    
    res.status(200).json({
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting plan', error: error.message });
  }
};

module.exports = {
  createPlan,
  getAllPlans,
  updatePlan,
  deletePlan,
};