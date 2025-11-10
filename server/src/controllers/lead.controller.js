const { Lead, Subscription, User, Plan, LeadDatabase, AdminGrant } = require('../models');
const { Op } = require('sequelize');
const { fetchLeadsFromExternalDatabase } = require('../services/leadDatabaseService');
const { processWebhookLead, getAllLeadTables, getLeadsFromTable } = require('../services/dynamicLeadService');

// Get all user subscriptions with lead access
const getUserLeadsOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all active subscriptions with plan details
    const subscriptions = await Subscription.findAll({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gte]: new Date() }
      },
      include: [{
        model: Plan,
        include: [{
          model: LeadDatabase
        }]
      }]
    });

    if (!subscriptions.length) {
      return res.status(404).json({ message: 'No active subscriptions found' });
    }

    // Format response with lead access info
    const leadsOverview = subscriptions.map(sub => ({
      subscriptionId: sub.id,
      planId: sub.planId,
      planName: sub.Plan.name,
      planDescription: sub.Plan.description,
      endDate: sub.endDate,
      leadDatabase: sub.Plan.LeadDatabase ? {
        id: sub.Plan.LeadDatabase.id,
        name: sub.Plan.LeadDatabase.name,
        description: sub.Plan.LeadDatabase.description
      } : null,
      leadTables: sub.Plan.leadTables || [], // NEW: Include dynamic lead tables
      leadLimit: sub.Plan.leadLimit,
      hasLeadAccess: !!sub.Plan.LeadDatabase || (sub.Plan.leadTables && sub.Plan.leadTables.length > 0), // Check both
      isAdminGranted: sub.paymentId === 'admin_granted'
    }));

    res.status(200).json({
      message: 'User leads overview fetched successfully',
      leadsOverview
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching leads overview', 
      error: error.message 
    });
  }
};

// Get leads for a specific plan (with access check)
const getPlanLeads = async (req, res) => {
  try {
    const plan = req.plan; // Set by checkPlanAccess middleware
    const subscription = req.subscription;
    const { tableName } = req.query; // Optional: specific table to fetch
    
    // Check if plan has dynamic lead tables (new approach)
    if (plan.leadTables && plan.leadTables.length > 0) {
      const availableTables = plan.leadTables;
      
      // If specific table requested, validate it's in the plan
      if (tableName) {
        if (!availableTables.includes(tableName)) {
          return res.status(403).json({ 
            message: 'Access denied to this lead table'
          });
        }
        
        // Fetch leads from specific table
        const leads = await getLeadsFromTable(tableName, plan.leadLimit);
        
        // Get allowed fields for this table from plan configuration
        const allowedFields = plan.leadTableFields && plan.leadTableFields[tableName] 
          ? plan.leadTableFields[tableName] 
          : [];
        
        // Filter leads to only show allowed fields if specified
        let filteredLeads = leads;
        if (allowedFields.length > 0) {
          filteredLeads = leads.map(lead => {
            const filteredLead = {
              id: lead.id,
              created_at: lead.created_at,
              updated_at: lead.updated_at
            };
            
            // Only include allowed fields
            allowedFields.forEach(field => {
              if (lead[field] !== undefined) {
                filteredLead[field] = lead[field];
              }
            });
            
            return filteredLead;
          });
        }
        
        return res.status(200).json({
          leads: filteredLeads,
          planName: plan.name,
          leadTables: availableTables,
          currentTable: tableName,
          leadLimit: plan.leadLimit,
          totalLeads: filteredLeads.length,
          allowedFields: allowedFields.length > 0 ? allowedFields : null, // null means all fields allowed
          isAdminGranted: subscription.paymentId === 'admin_granted'
        });
      }
      
      // Return available tables info
      return res.status(200).json({
        planName: plan.name,
        leadTables: availableTables,
        leadLimit: plan.leadLimit,
        isAdminGranted: subscription.paymentId === 'admin_granted',
        message: 'Select a table to view leads'
      });
    }
    
    // Legacy approach: external lead database
    if (!plan.LeadDatabase) {
      return res.status(200).json({ 
        leads: [],
        leadTables: [],
        message: 'No lead database assigned to this plan'
      });
    }
    
    let leads = [];
    let usingMockData = false;
    
    // Try to fetch leads from external database
    try {
      leads = await fetchLeadsFromExternalDatabase(
        plan.LeadDatabase, 
        plan.leadLimit
      );
    } catch (error) {
      // Fallback to mock leads if external database fails
      usingMockData = true;
      leads = generateMockLeads(plan);
    }
    
    res.status(200).json({
      leads: leads,
      planName: plan.name,
      leadDatabase: plan.LeadDatabase.name,
      leadTables: [],
      leadLimit: plan.leadLimit,
      totalLeads: leads.length,
      isAdminGranted: subscription.paymentId === 'admin_granted',
      usingMockData
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plan leads', error: error.message });
  }
};

// Legacy endpoint - kept for backward compatibility
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
      return res.status(200).json({ 
        leads: [],
        message: 'No lead database assigned to this plan'
      });
    }
    
    let leads = [];
    let usingMockData = false;
    
    // Try to fetch leads from external database
    try {
      leads = await fetchLeadsFromExternalDatabase(
        activeSubscription.Plan.LeadDatabase, 
        activeSubscription.Plan.leadLimit
      );
    } catch (error) {
      // Fallback to mock leads if external database fails
      usingMockData = true;
      leads = generateMockLeads(activeSubscription.Plan);
    }
    
    res.status(200).json({
      leads: leads,
      planName: activeSubscription.Plan.name,
      leadDatabase: activeSubscription.Plan.LeadDatabase.name,
      leadLimit: activeSubscription.Plan.leadLimit,
      totalLeads: leads.length,
      isAdminGranted: activeSubscription.paymentId === 'admin_granted',
      usingMockData
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads', error: error.message });
  }
};

// Helper function to generate mock leads based on plan
const generateMockLeads = (plan) => {
  const leadDatabase = plan.LeadDatabase;
  const leadLimit = plan.leadLimit || 50; // Default to 50 if no limit set
  
  const mockLeads = [];
  const businessTypes = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate'];
  const statuses = ['new', 'contacted', 'qualified', 'closed'];
  const sources = ['Website', 'Social Media', 'Email Campaign', 'Referral', 'Cold Call'];
  
  for (let i = 1; i <= Math.min(leadLimit, 100); i++) {
    mockLeads.push({
      id: i,
      name: `Lead ${i} - ${leadDatabase.name}`,
      email: `lead${i}@example${i % 10}.com`,
      mobile: `+91 ${9000000000 + i}`,
      website: `https://company${i}.com`,
      business: businessTypes[i % businessTypes.length],
      company: `Company ${i}`,
      status: statuses[i % statuses.length],
      source: sources[i % sources.length],
      notes: `Generated lead from ${leadDatabase.name} database`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      lastContact: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
    });
  }
  
  return mockLeads;
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

// Webhook endpoint for Elementor forms
const collectLeadWebhook = async (req, res) => {
  try {
    console.log('📥 Webhook received:', req.body);
    
    const webhookData = req.body;
    
    // Validate form_key
    if (!webhookData.form_key) {
      return res.status(400).json({ 
        success: false,
        message: 'form_key is required' 
      });
    }
    
    // Process and store the lead
    const result = await processWebhookLead(webhookData);
    
    console.log(`✅ Lead stored in table: ${result.tableName}`);
    
    res.status(200).json({
      success: true,
      message: result.message,
      tableName: result.tableName,
      leadId: result.lead.id
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing webhook', 
      error: error.message 
    });
  }
};

// Get all available lead tables for admin
const getAvailableLeadTables = async (req, res) => {
  try {
    const tables = await getAllLeadTables();
    
    // Format for frontend
    const formattedTables = tables.map(tableName => ({
      value: tableName,
      label: tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
    
    res.status(200).json({
      success: true,
      tables: formattedTables
    });
  } catch (error) {
    console.error('Error fetching lead tables:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching lead tables', 
      error: error.message 
    });
  }
};

// Get leads from specific dynamic table
const getLeadsFromDynamicTable = async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit } = req.query;
    
    const leads = await getLeadsFromTable(tableName, limit ? parseInt(limit) : null);
    
    res.status(200).json({
      success: true,
      tableName,
      leads,
      totalLeads: leads.length
    });
  } catch (error) {
    console.error('Error fetching leads from table:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching leads', 
      error: error.message 
    });
  }
};

module.exports = {
  getUserLeads,
  getUserLeadsOverview,
  getPlanLeads,
  getAdminLeads,
  exportLeads,
  collectLeadWebhook,
  getAvailableLeadTables,
  getLeadsFromDynamicTable
};