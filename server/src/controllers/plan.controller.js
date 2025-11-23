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
   
    
    let { 
      name, 
      description, 
      price, 
      duration, 
      features, 
      leadDatabaseId,
      leadTables,
      leadTableFields,
      leadLimit,
      htmlContent,
      contentUrls 
    } = req.body;

    // Handle features field - convert array back to JSON string for database storage
    let featuresString = null;
    if (features) {
      if (typeof features === 'string') {
        // If it's already a JSON string, validate it and use as-is
        try {
          JSON.parse(features); // Validate it's valid JSON
          featuresString = features;
        } catch (e) {
          featuresString = JSON.stringify([]);
        }
      } else if (Array.isArray(features)) {
        // If it's an array, convert to JSON string
        featuresString = JSON.stringify(features);
      } else {
        // If it's something else, create empty array
        featuresString = JSON.stringify([]);
      }
    }

    // Convert numeric fields
    if (price) price = parseFloat(price);
    if (duration) duration = parseInt(duration);
    if (leadDatabaseId) leadDatabaseId = parseInt(leadDatabaseId);
    if (leadLimit) leadLimit = parseInt(leadLimit);
    
    // Handle leadTables - convert to array if needed
    let leadTablesArray = [];
    if (leadTables) {
      if (typeof leadTables === 'string') {
        try {
          leadTablesArray = JSON.parse(leadTables);
        } catch (e) {
          leadTablesArray = [];
        }
      } else if (Array.isArray(leadTables)) {
        leadTablesArray = leadTables;
      }
    }

    // Handle leadTableFields - convert to object if needed
    let leadTableFieldsObj = {};
    if (leadTableFields) {
      if (typeof leadTableFields === 'string') {
        try {
          leadTableFieldsObj = JSON.parse(leadTableFields);
        } catch (e) {
          leadTableFieldsObj = {};
        }
      } else if (typeof leadTableFields === 'object') {
        leadTableFieldsObj = leadTableFields;
      }
    }

    // Handle contentUrls - convert to array if needed
    let contentUrlsArray = [];
    if (contentUrls) {
      if (typeof contentUrls === 'string') {
        try {
          contentUrlsArray = JSON.parse(contentUrls);
        } catch (e) {
          contentUrlsArray = [];
        }
      } else if (Array.isArray(contentUrls)) {
        contentUrlsArray = contentUrls;
      }
    }

    // Process contentUrls: if password is empty, set it to null (no password needed)
    contentUrlsArray = contentUrlsArray.map(content => ({
      ...content,
      password: content.password && content.password.trim() !== '' ? content.password : null
    }));


    // Validate required fields
    if (!name || !description || price === undefined || price === null || !duration) {
    
      return res.status(400).json({ 
        message: 'Missing required fields: name, description, price, and duration are required',
        received: { name, description, price, duration }
      });
    }

    // Validate data types
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ 
        message: 'Price must be a valid positive number',
        received: { price }
      });
    }

    if (isNaN(duration) || duration < 1) {
      return res.status(400).json({ 
        message: 'Duration must be a valid positive number (days)',
        received: { duration }
      });
    }
    
    // Allow any HTML content for admin users
    let sanitizedHtmlContent = htmlContent || null;
    if (htmlContent) {
    }

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
    const planData = {
      name,
      description,
      price,
      duration,
      features: featuresString,
      leadDatabaseId: leadDatabaseId || null,
      leadTables: leadTablesArray,
      leadTableFields: leadTableFieldsObj,
      leadLimit: leadLimit || null,
      htmlContent: sanitizedHtmlContent,
      documents,
      contentUrls: contentUrlsArray
    };
    
    let plan;
    try {
      plan = await Plan.create(planData);
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      if (dbError.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          details: dbError.errors.map(e => e.message).join(', ')
        });
      }
      if (dbError.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          message: 'A plan with this name already exists' 
        });
      }
      throw dbError; // Re-throw if it's not a validation error
    }

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
    console.error('❌ Error creating plan:', error);
    res.status(500).json({ message: 'Error creating plan', error: error.message });
  }
};


const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({
      where: { isActive: true },
      include: [{
        model: LeadDatabase,
        attributes: ['id', 'name', 'description']
      }]
    });
    
    // Parse features JSON strings back to arrays for frontend
    // For public endpoint, exclude HTML content (premium feature)
    const parsedPlans = plans.map(plan => {
      const planData = plan.toJSON();
      
      // Parse features
      if (planData.features) {
        try {
          planData.features = JSON.parse(planData.features);
        } catch (e) {
          planData.features = [];
        }
      } else {
        planData.features = [];
      }
      
      // Remove HTML content from public endpoint (premium feature)
      // Only show indicator that content exists
      if (planData.htmlContent) {
        planData.hasHtmlContent = true;
        delete planData.htmlContent; // Don't send actual content
      } else {
        planData.hasHtmlContent = false;
      }

      // Ensure contentUrls is always an array
      if (!planData.contentUrls || !Array.isArray(planData.contentUrls)) {
        planData.contentUrls = [];
      }
      
      return planData;
    });
    
    
    res.status(200).json(parsedPlans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plans', error: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    let { 
      name, 
      description, 
      price, 
      duration, 
      features, 
      isActive,
      leadDatabaseId,
      leadTables,
      leadTableFields,
      leadLimit,
      htmlContent,
      contentUrls 
    } = req.body;

    // Handle features field - convert array back to JSON string for database storage
    let featuresString = features;
    if (features !== undefined) {
      if (typeof features === 'string') {
        // If it's already a JSON string, validate it and use as-is
        try {
          JSON.parse(features); // Validate it's valid JSON
          featuresString = features;
        } catch (e) {
          featuresString = JSON.stringify([]);
        }
      } else if (Array.isArray(features)) {
        // If it's an array, convert to JSON string
        featuresString = JSON.stringify(features);
      } else if (features === null || features === '') {
        featuresString = null;
      }
    }
    
    const plan = await Plan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Handle leadTables
    let leadTablesArray = plan.leadTables || [];
    if (leadTables !== undefined) {
      if (typeof leadTables === 'string') {
        try {
          leadTablesArray = JSON.parse(leadTables);
        } catch (e) {
          leadTablesArray = [];
        }
      } else if (Array.isArray(leadTables)) {
        leadTablesArray = leadTables;
      } else if (leadTables === null) {
        leadTablesArray = [];
      }
    }

    // Handle leadTableFields
    let leadTableFieldsObj = plan.leadTableFields || {};
    if (leadTableFields !== undefined) {
      if (typeof leadTableFields === 'string') {
        try {
          leadTableFieldsObj = JSON.parse(leadTableFields);
        } catch (e) {
          leadTableFieldsObj = {};
        }
      } else if (typeof leadTableFields === 'object' && leadTableFields !== null) {
        leadTableFieldsObj = leadTableFields;
      } else if (leadTableFields === null) {
        leadTableFieldsObj = {};
      }
    }

    // Handle contentUrls
    let contentUrlsArray = plan.contentUrls || [];
    if (contentUrls !== undefined) {
      if (typeof contentUrls === 'string') {
        try {
          contentUrlsArray = JSON.parse(contentUrls);
        } catch (e) {
          contentUrlsArray = [];
        }
      } else if (Array.isArray(contentUrls)) {
        contentUrlsArray = contentUrls;
      } else if (contentUrls === null) {
        contentUrlsArray = [];
      }
    }

    // Process contentUrls: if password is empty, set it to null (no password needed)
    contentUrlsArray = contentUrlsArray.map(content => ({
      ...content,
      password: content.password && content.password.trim() !== '' ? content.password : null
    }));
    
    // Allow any HTML content for admin users
    let sanitizedHtmlContent = plan.htmlContent;
    if (htmlContent !== undefined) {
      sanitizedHtmlContent = htmlContent || null;
      if (htmlContent) {
      }
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
      features: featuresString,
      isActive,
      leadDatabaseId: leadDatabaseId || null,
      leadTables: leadTablesArray,
      leadTableFields: leadTableFieldsObj,
      leadLimit: leadLimit || null,
      htmlContent: sanitizedHtmlContent,
      documents,
      contentUrls: contentUrlsArray
    });
    
    res.status(200).json({
      message: 'Plan updated successfully',
      plan,
    });
  } catch (error) {
    console.error('❌ Error updating plan:', error);
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