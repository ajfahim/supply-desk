const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supply-desk');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function migrateSettings() {
  await connectDB();
  
  try {
    // Delete the old settings document
    await mongoose.connection.db.collection('settings').deleteMany({});
    console.log('Deleted old settings');
    
    // Insert new settings with correct structure
    const newSettings = {
      company: {
        companyName: "Steelroot Traders",
        address: {
          street: "109, Nawabpur, Wari",
          city: "Dhaka",
          state: "Dhaka",
          country: "Bangladesh",
          zipCode: "1203"
        },
        contact: {
          email: "steelroottraders@gmail.com",
          phone: "+8801781748034",
          website: ""
        },
        logo: "",
        bin: "Tax-123"
      },
      quotation: {
        authorizedBy: {
          name: "Md. Ataur Rahaman",
          designation: "Proprietor - Optimech Project Solution"
        }
      },
      pricing: {
        defaultProfitMargin: 15,
        showVendorCosts: false,
        allowNegativeMargins: false,
        roundPrices: true,
        currency: "BDT"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await mongoose.connection.db.collection('settings').insertOne(newSettings);
    console.log('Inserted new settings with correct structure');
    
    // Verify the new structure
    const result = await mongoose.connection.db.collection('settings').findOne({});
    console.log('New settings structure:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Migration completed');
  }
}

migrateSettings();
