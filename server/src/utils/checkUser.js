const User = require('../models/user.model');
const { sequelize } = require('../config/db.config');

const checkUser = async () => {
  try {
    await sequelize.sync();
    
    const user = await User.findOne({
      where: { email: 'mayureshkhot15@gmail.com' }
    });
    
    if (user) {
      console.log('User found:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      });
      
      // Test password
      const isPasswordValid = await user.comparePassword('1511@Bameetech');
      console.log('Password test result:', isPasswordValid);
      
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

checkUser();