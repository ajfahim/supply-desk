const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function seedSuperAdmin() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('supply-desk');
    const collection = db.collection('users');
    
    // Check if super admin already exists
    const existingSuperAdmin = await collection.findOne({
      role: 'super_admin'
    });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.username);
      return;
    }
    
    // Create super admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const superAdmin = {
      username: 'admin',
      email: 'admin@supplydesk.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(superAdmin);
    
    console.log('Super admin created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please change the password after first login');
    
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed
seedSuperAdmin().catch(console.error);
