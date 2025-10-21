// Script to migrate department names from full names to short codes
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Event = require('../models/Event');

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

async function migrateDepartments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!\n');

    // Find all events
    const events = await Event.find({});
    console.log(`Found ${events.length} events to check\n`);

    let updatedCount = 0;

    for (const event of events) {
      let needsUpdate = false;
      
      // Update eligibleDepartments array
      if (event.eligibleDepartments && event.eligibleDepartments.length > 0) {
        const newEligibleDepts = event.eligibleDepartments.map(dept => {
          const mapped = departmentMapping[dept];
          if (mapped) {
            console.log(`  Mapping: "${dept}" → "${mapped}"`);
            needsUpdate = true;
            return mapped;
          }
          return dept;
        });
        
        if (needsUpdate) {
          event.eligibleDepartments = newEligibleDepts;
        }
      }

      // Update department field if it exists
      if (event.department && departmentMapping[event.department]) {
        console.log(`  Department: "${event.department}" → "${departmentMapping[event.department]}"`);
        event.department = departmentMapping[event.department];
        needsUpdate = true;
      }

      if (needsUpdate) {
        await event.save();
        updatedCount++;
        console.log(`✓ Updated event: ${event.name}\n`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`Updated ${updatedCount} events`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateDepartments();
