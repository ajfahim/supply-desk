const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://supplyDesk:supplyDesk@cluster0.uh9rxet.mongodb.net/supply-desk');

const chalanSchema = new mongoose.Schema({}, { strict: false });
const Chalan = mongoose.model('Chalan', chalanSchema);

async function updateChalansWithDriverPhone() {
  try {
    console.log('Updating chalans with driverPhone field...');
    
    // Find chalans that have driverName but no driverPhone
    const chalans = await Chalan.find({
      driverName: { $exists: true, $ne: null, $ne: '' },
      driverPhone: { $exists: false }
    });
    
    console.log(`Found ${chalans.length} chalans to update`);
    
    for (const chalan of chalans) {
      await Chalan.updateOne(
        { _id: chalan._id },
        { $set: { driverPhone: '+8801712345678' } }
      );
      console.log(`Updated chalan ${chalan._id} with driver phone`);
    }
    
    console.log('Update completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating chalans:', error);
    process.exit(1);
  }
}

updateChalansWithDriverPhone();
