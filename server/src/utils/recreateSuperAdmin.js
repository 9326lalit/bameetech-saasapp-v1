const User = require('../models/user.model');
const { sequelize } = require('../config/db.config');

const recreateSuperAdmin = async () => {
  try {
    await sequelize.sync({ alter: true });
    
    // Delete existing user
    await User.destroy({
      where: { email: 'mayureshkhot15@gmail.com' }
    });
    
    
    // Create new super admin
    const superAdmin = await User.create({
      name: 'Mayuresh Khot',
      email: 'mayureshkhot15@gmail.com',
      password: '1511@Bameetech',
      role: 'super_admin'
    });
   
    
    // Test password
    const isPasswordValid = await superAdmin.comparePassword('1511@Bameetech');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

recreateSuperAdmin();