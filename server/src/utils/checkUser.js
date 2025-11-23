const User = require('../models/user.model');
const { sequelize } = require('../config/db.config');

const checkUser = async () => {
  try {
    await sequelize.sync();
    
    const user = await User.findOne({
      where: { email: 'mayureshkhot15@gmail.com' }
    });
    
    if (user) {    
      // Test password
      const isPasswordValid = await user.comparePassword('1511@Bameetech');
      
    } else {
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

checkUser();