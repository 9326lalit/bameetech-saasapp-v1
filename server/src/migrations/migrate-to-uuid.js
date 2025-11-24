/**
 * Migration Script: Convert Integer IDs to UUIDs
 * 
 * ⚠️ WARNING: This is a destructive operation!
 * - Backup your database before running
 * - This will drop and recreate all tables
 * - All existing data will be lost
 * 
 * Usage: node src/migrations/migrate-to-uuid.js
 */

const { sequelize } = require('../config/db.config');
const {
  User,
  Plan,
  Subscription,
  Payment,
  Lead,
  LeadDatabase,
  AdminGrant,
  OTP,
  ContentAccess,
} = require('../models');

async function migrateToUUID() {
  try {
    console.log('🚀 Starting UUID Migration...\n');
    
    // Step 1: Backup reminder
    console.log('⚠️  IMPORTANT: Make sure you have backed up your database!');
    console.log('   This operation will DROP all tables and recreate them with UUIDs.\n');
    
    // Wait for user confirmation (in production, you'd want manual confirmation)
    console.log('📋 Migration Steps:');
    console.log('   1. Drop all existing tables');
    console.log('   2. Recreate tables with UUID primary keys');
    console.log('   3. Update all foreign key references to UUID\n');
    
    // Step 2: Test database connection
    console.log('🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Step 3: Drop all tables (PostgreSQL CASCADE handles foreign keys)
    console.log('🗑️  Dropping existing tables...');
    
    await ContentAccess.drop({ cascade: true });
    console.log('   ✓ Dropped ContentAccess');
    
    await AdminGrant.drop({ cascade: true });
    console.log('   ✓ Dropped AdminGrant');
    
    await OTP.drop({ cascade: true });
    console.log('   ✓ Dropped OTP');
    
    await Payment.drop({ cascade: true });
    console.log('   ✓ Dropped Payment');
    
    await Subscription.drop({ cascade: true });
    console.log('   ✓ Dropped Subscription');
    
    await Lead.drop({ cascade: true });
    console.log('   ✓ Dropped Lead');
    
    await Plan.drop({ cascade: true });
    console.log('   ✓ Dropped Plan');
    
    await LeadDatabase.drop({ cascade: true });
    console.log('   ✓ Dropped LeadDatabase');
    
    await User.drop({ cascade: true });
    console.log('   ✓ Dropped User\n');
    
    // Step 4: Create tables with UUID
    console.log('🔨 Creating tables with UUID primary keys...');
    
    await User.sync({ force: false });
    console.log('   ✓ Created User with UUID');
    
    await LeadDatabase.sync({ force: false });
    console.log('   ✓ Created LeadDatabase with UUID');
    
    await Plan.sync({ force: false });
    console.log('   ✓ Created Plan with UUID');
    
    await Subscription.sync({ force: false });
    console.log('   ✓ Created Subscription with UUID');
    
    await Payment.sync({ force: false });
    console.log('   ✓ Created Payment with UUID');
    
    await Lead.sync({ force: false });
    console.log('   ✓ Created Lead with UUID');
    
    await AdminGrant.sync({ force: false });
    console.log('   ✓ Created AdminGrant with UUID');
    
    await OTP.sync({ force: false });
    console.log('   ✓ Created OTP with UUID');
    
    await ContentAccess.sync({ force: false });
    console.log('   ✓ Created ContentAccess with UUID\n');
    
    // Step 5: Create super admin accounts
    console.log('👤 Creating super admin accounts...');
    
    const admin1 = await User.create({
      name: 'Mayuresh Khot',
      email: 'mayureshkhot15@gmail.com',
      password: '123456',
      role: 'super_admin',
      isActive: true,
    });
    console.log(`   ✓ Created admin 1: ${admin1.email} (UUID: ${admin1.id})`);
    
    const admin2 = await User.create({
      name: 'Kanthekar',
      email: 'kanthekarb@gmail.com',
      password: 'Bameetech@mh12',
      role: 'super_admin',
      isActive: true,
    });
    console.log(`   ✓ Created admin 2: ${admin2.email} (UUID: ${admin2.id})\n`);
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - All tables now use UUID primary keys');
    console.log('   - All foreign keys updated to UUID');
    console.log('   - 2 Super admin accounts created');
    console.log('\n👥 Super Admin Accounts:');
    console.log('   1. Email: mayureshkhot15@gmail.com');
    console.log('      Password: 123456');
    console.log('   2. Email: kanthekarb@gmail.com');
    console.log('      Password: Bameetech@mh12');
    console.log('\n⚠️  Remember to:');
    console.log('   1. Test login with both admin accounts');
    console.log('   2. Test all API endpoints');
    console.log('   3. Verify UUID format in responses');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateToUUID();
