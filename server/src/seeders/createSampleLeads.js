const { Lead } = require('../models');
const { sequelize } = require('../config/db.config');

const createSampleLeads = async () => {
  try {
    // Don't sync here as it's already done in the main app
    
    // Check if sample leads already exist
    const existingLeads = await Lead.findAll();
    if (existingLeads.length > 0) {
      console.log('Sample leads already exist');
      return;
    }
    
    const sampleLeads = [
      {
        name: 'John Smith',
        email: 'john.smith@techcorp.com',
        phone: '+91 9876543210',
        company: 'TechCorp Solutions',
        status: 'new',
        source: 'Website',
        notes: 'Interested in enterprise solutions'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.j@healthplus.com',
        phone: '+91 9876543211',
        company: 'HealthPlus Medical',
        status: 'contacted',
        source: 'Referral',
        notes: 'Looking for healthcare management system'
      },
      {
        name: 'Mike Chen',
        email: 'mike.chen@financegroup.com',
        phone: '+91 9876543212',
        company: 'Finance Group Ltd',
        status: 'qualified',
        source: 'LinkedIn',
        notes: 'Ready to discuss pricing'
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@retailworld.com',
        phone: '+91 9876543213',
        company: 'Retail World',
        status: 'new',
        source: 'Cold Call',
        notes: 'Needs inventory management solution'
      },
      {
        name: 'David Wilson',
        email: 'david.w@manufacturing.com',
        phone: '+91 9876543214',
        company: 'Wilson Manufacturing',
        status: 'contacted',
        source: 'Trade Show',
        notes: 'Interested in automation tools'
      }
    ];
    
    for (const leadData of sampleLeads) {
      await Lead.create(leadData);
    }
    
    console.log(`Created ${sampleLeads.length} sample leads`);
    
  } catch (error) {
    console.error('Error creating sample leads:', error);
  }
};

module.exports = createSampleLeads;

// Run if called directly
if (require.main === module) {
  createSampleLeads().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}