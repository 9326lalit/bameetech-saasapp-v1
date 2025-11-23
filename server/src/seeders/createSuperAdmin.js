const User = require('../models/user.model');

const superAdmins = [
  {
    name: 'Mayuresh Khot',
    email: 'mayureshkhot15@gmail.com',
    password: '1511@Bameetech'
  },
  {
    name: 'Lalit Khairnar',
    email: 'lalitkhairnar93@gmail.com',
    password: 'Lalit@123'
  }
];

const createSuperAdmins = async () => {
  try {
    for (const admin of superAdmins) {
      const existing = await User.findOne({ where: { email: admin.email } });

      if (existing) {
        if (existing.role !== 'super_admin') {
          await existing.update({ role: 'super_admin' });
        }
      } else {
        const newAdmin = await User.create({ ...admin, role: 'super_admin' });
      }
    }
  } catch (error) {
    console.error('Error creating super admins:', error);
  }
};

module.exports = createSuperAdmins;

// Run if called directly
if (require.main === module) {
  createSuperAdmins().then(() => process.exit(0)).catch(() => process.exit(1));
}
