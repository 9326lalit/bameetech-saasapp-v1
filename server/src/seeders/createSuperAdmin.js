// const User = require('../models/user.model');
// const { sequelize } = require('../config/db.config');

// const createSuperAdmin = async () => {
//   try {
//     // Don't sync here as it's already done in the main app
    
//     // Check if super admin already exists
//     const existingSuperAdmin = await User.findOne({
//       where: { email: 'mayureshkhot15@gmail.com' }
//     });
    
//     if (existingSuperAdmin) {
//       console.log('Super admin already exists');
//       // Update role if it's not super_admin
//       if (existingSuperAdmin.role !== 'super_admin') {
//         await existingSuperAdmin.update({ role: 'super_admin' });
//         console.log('Updated existing user to super_admin role');
//       }
//       return;
//     }
    
//     // Create super admin user
//     const superAdmin = await User.create({
//       name: 'Mayuresh Khot',
//       email: 'mayureshkhot15@gmail.com',
//       password: '1511@Bameetech',
//       role: 'super_admin'
//     });
    
//     console.log('Super admin created successfully:', {
//       id: superAdmin.id,
//       name: superAdmin.name,
//       email: superAdmin.email,
//       role: superAdmin.role,
//       password: superAdmin.password // Log the password for initial login
//     });
    
//   } catch (error) {
//     console.error('Error creating super admin:', error);
//   }
// };

// module.exports = createSuperAdmin;

// // Run if called directly
// if (require.main === module) {
//   createSuperAdmin().then(() => {
//     process.exit(0);
//   }).catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
// }

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
        console.log(`${admin.name} already exists`);
        if (existing.role !== 'super_admin') {
          await existing.update({ role: 'super_admin' });
          console.log(`Updated ${admin.name} to super_admin role`);
        }
      } else {
        const newAdmin = await User.create({ ...admin, role: 'super_admin' });
        console.log(`Created super admin: ${newAdmin.name} (${newAdmin.email})`);
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
