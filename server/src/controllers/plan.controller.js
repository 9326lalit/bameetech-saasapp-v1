const { Plan, LeadDatabase } = require('../models');

const createPlan = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      duration, 
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
    
    res.status(201).json({
      message: 'Plan created successfully',
      plan,
    });
  } catch (error) {
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