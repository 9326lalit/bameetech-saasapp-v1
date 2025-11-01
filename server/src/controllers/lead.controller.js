const { Lead, Subscription, User, Plan, LeadDatabase } = require('../models');
const { Op } = require('sequelize');

const getUserLeads = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has active subscription with plan details
    const activeSubscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: {
          [Op.gte]: new Date(),
        },
      },
      include: [{
        model: Plan,
        include: [{
          model: LeadDatabase
        }]
      }]
    });
    
    if (!activeSubscription) {
      return res.status(403).json({ message: 'No active subscription found' });
    }
    
    // If no lead database is assigned to the plan, return empty array
    if (!activeSubscription.Plan.LeadDatabase) {
      return res.status(200).json([]);
    }
    
    // For demo purposes, return mock leads based on the plan
    // In production, you would connect to the actual database specified in LeadDatabase
    // const mockLeads = generateMockLeads(activeSubscription.Plan);
    
    res.status(200).json("leads not found for this plan ...please contact to company!!!");
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads', error: error.message });
  }
};

// Helper function to generate mock leads based on plan
// const generateMockLeads = (plan) => {
//   const leadDatabase = plan.LeadDatabase;
//   const leadLimit = plan.leadLimit || 50; // Default to 50 if no limit set
  
//   const mockLeads = [];
//   const businessTypes = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate'];
//   const statuses = ['new', 'contacted', 'qualified', 'closed'];
  
//   for (let i = 1; i <= Math.min(leadLimit, 50); i++) {
//     mockLeads.push({
//       id: i,
//       name: `Lead ${i} - ${leadDatabase.name}`,
//       email: `lead${i}@example.com`,
//       mobile: `+91 ${9000000000 + i}`,
//       website: `https://company${i}.com`,
//       business: businessTypes[i % businessTypes.length],
//       company: `Company ${i}`,
//       status: statuses[i % statuses.length],
//       source: leadDatabase.name,
//       createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
//     });
//   }
  
//   return mockLeads;
// };

const getAdminLeads = async (req, res) => {
  try {
    const leads = await Lead.findAll();
    
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads', error: error.message });
  }
};

const exportLeads = async (req, res) => {
  try {
    const leads = await Lead.findAll();
    
    // Convert leads to CSV format
    const fields = ['id', 'name', 'email', 'phone', 'company', 'status', 'source', 'notes', 'createdAt', 'updatedAt'];
    const csv = [
      fields.join(','),
      ...leads.map(lead => fields.map(field => `"${lead[field] || ''}"`).join(',')),
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting leads', error: error.message });
  }
};

module.exports = {
  getUserLeads,
  getAdminLeads,
  exportLeads,
};