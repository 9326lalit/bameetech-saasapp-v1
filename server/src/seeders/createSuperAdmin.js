const User = require('../models/user.model');
const { sequelize } = require('../config/db.config');

const createSuperAdmin = async () => {
  try {
    // Don't sync here as it's already done in the main app
    
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({
      where: { email: 'mayureshkhot15@gmail.com' }
    });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      // Update role if it's not super_admin
      if (existingSuperAdmin.role !== 'super_admin') {
        await existingSuperAdmin.update({ role: 'super_admin' });
        console.log('Updated existing user to super_admin role');
      }
      return;
    }
    
    // Create super admin user
    const superAdmin = await User.create({
      name: 'Mayuresh Khot',
      email: 'mayureshkhot15@gmail.com',
      password: '1511@Bameetech',
      role: 'super_admin'
    });
    
    console.log('Super admin created successfully:', {
      id: superAdmin.id,
      name: superAdmin.name,
      email: superAdmin.email,
      role: superAdmin.role
    });
    
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
};

module.exports = createSuperAdmin;

// Run if called directly
if (require.main === module) {
  createSuperAdmin().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}