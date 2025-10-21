// Script to migrate user department names from full names to short codes
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const departmentMapping = {
  'Computer Science': 'CSE',
  'Information Technology': 'IT',
  'Electronics': 'ECE',
  'Electrical': 'EEE',
  'Mechanical': 'MECH',
  'Civil': 'CIVIL',
  // Handle case variations
  'computer science': 'CSE',
  'information technology': 'IT',
  'electronics': 'ECE',
  'electrical': 'EEE',
  'mechanical': 'MECH',
  'civil': 'CIVIL'
};

async function migrateUserDepartments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!\n');

    // Find all users with departments
    const users = await User.find({ department: { $exists: true, $ne: null } });
    console.log(`Found ${users.length} users with departments\n`);

    let updatedCount = 0;

    for (const user of users) {
      if (departmentMapping[user.department]) {
        console.log(`User: ${user.email}`);
        console.log(`  "${user.department}" → "${departmentMapping[user.department]}"`);
        
        user.department = departmentMapping[user.department];
        await user.save();
        updatedCount++;
        console.log(`✓ Updated\n`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`Updated ${updatedCount} users`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateUserDepartments();
