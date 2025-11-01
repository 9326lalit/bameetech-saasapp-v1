const User = require('../models/user.model');
const { sequelize } = require('../config/db.config');
const bcrypt = require('bcrypt');

const updateSuperAdmin = async () => {
  try {
    await sequelize.sync({ alter: true });
    
    const user = await User.findOne({
      where: { email: 'mayureshkhot15@gmail.com' }
    });
    
    if (user) {
      // Hash the password manually
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('1511@Bameetech', salt);
      
      // Update the user
      await user.update({
        name: 'Mayuresh Khot',
        password: hashedPassword,
        role: 'super_admin'
      });
      
      console.log('Super admin updated successfully');
      
      // Test the password
      const isPasswordValid = await user.comparePassword('1511@Bameetech');
      console.log('Password test after update:', isPasswordValid);
      
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

updateSuperAdmin();