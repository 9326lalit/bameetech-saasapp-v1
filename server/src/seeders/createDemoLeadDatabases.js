const { LeadDatabase } = require('../models');
const { sequelize } = require('../config/db.config');

const createDemoLeadDatabases = async () => {
  try {
    // Check if demo databases already exist
    const existingDatabases = await LeadDatabase.findAll();
    if (existingDatabases.length > 0) {
      // console.log('Demo lead databases already exist');
      return;
    }
    
    // Create demo lead databases
    const demoDatabases = [
      {
        name: 'Basic Leads Database',
        description: 'Contains basic lead information for starter plans',
        host: 'localhost',
        port: 3306,
        database: 'bamee_basic_leads',
        username: 'demo_user',
        password: 'demo_password',
        tableName: 'basic_leads',
        fieldMappings: {
          name: 'full_name',
          email: 'email_address',
          mobile: 'phone_number',
          website: 'company_website',
          business: 'business_type'
        }
      },
      {
        name: 'Premium Leads Database',
        description: 'Enhanced lead database with additional business information',
        host: 'localhost',
        port: 3306,
        database: 'bamee_premium_leads',
        username: 'demo_user',
        password: 'demo_password',
        tableName: 'premium_leads',
        fieldMappings: {
          name: 'contact_name',
          email: 'business_email',
          mobile: 'contact_phone',
          website: 'website_url',
          business: 'industry_type',
          company: 'company_name',
          location: 'business_location'
        }
      },
      {
        name: 'Enterprise Leads Database',
        description: 'Comprehensive lead database with detailed business insights',
        host: 'localhost',
        port: 3306,
        database: 'bamee_enterprise_leads',
        username: 'demo_user',
        password: 'demo_password',
        tableName: 'enterprise_leads',
        fieldMappings: {
          name: 'decision_maker',
          email: 'primary_email',
          mobile: 'direct_phone',
          website: 'corporate_website',
          business: 'business_category',
          company: 'organization_name',
          location: 'headquarters',
          revenue: 'annual_revenue',
          employees: 'employee_count'
        }
      }
    ];
    
    for (const dbData of demoDatabases) {
      await LeadDatabase.create(dbData);
      // console.log(`Created demo database: ${dbData.name}`);
    }
    
    // console.log('Demo lead databases created successfully');
    
  } catch (error) {
    console.error('Error creating demo lead databases:', error);
  }
};

module.exports = createDemoLeadDatabases;

// Run if called directly
if (require.main === module) {
  createDemoLeadDatabases().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}