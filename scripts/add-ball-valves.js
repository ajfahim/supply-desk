const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define schemas directly since we can't import TypeScript modules in Node.js
const { Schema } = mongoose;

// Vendor Schema
const VendorSchema = new Schema({
  companyName: { type: String, required: true, trim: true },
  contactPerson: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true },
  },
  specialties: [{ type: String, trim: true }],
  paymentTerms: { type: String, trim: true },
  deliveryTime: { type: String, trim: true },
  reliability: { type: Number, min: 1, max: 5, default: 3 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Category Schema
const CategorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  parentCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
  attributes: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Vendor Price Schema
const VendorPriceSchema = new Schema({
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'BDT' },
  validUntil: { type: Date, required: true },
  minimumQuantity: { type: Number, default: 1, min: 1 },
  deliveryTime: { type: String, trim: true },
  lastUpdated: { type: Date, default: Date.now },
});

// Product Schema
const ProductSchema = new Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  modelName: { type: String, trim: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, trim: true },
  specifications: { type: Schema.Types.Mixed, default: {} },
  unit: { type: String, required: true, trim: true, default: 'pcs' },
  images: [{ type: String, trim: true }],
  hsCode: { type: String, trim: true },
  vendorPrices: [VendorPriceSchema],
}, { timestamps: true });

// Create models
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

const ballValveProducts = [
  {
    name: "Flange type ball valve (pn 16) (DN 50)",
    brand: "Optimech",
    modelName: "DN 50 PN16",
    description: "SS304 Ball Valve Body- CF8 casting body with top pad type, Ball & Stem CF8/304, Seat: PTFE, Pressure 20 bar, max. Temperatures150 degree oC . Connection - Flange PN16",
    specifications: {
      material: "SS304",
      body: "CF8 casting",
      ballAndStem: "CF8/304",
      seat: "PTFE",
      pressure: "20 bar",
      maxTemperature: "150°C",
      connection: "Flange PN16",
      size: "DN 50",
      pressureRating: "PN 16",
      origin: "China-Imported"
    },
    unit: "pcs"
  },
  {
    name: "Flange type ball valve (pn 16) (DN 40)",
    brand: "Optimech",
    modelName: "DN 40 PN16",
    description: "SS304 Ball Valve Body- CF8 casting body with top pad type, Ball & Stem CF8/304, Seat: PTFE, Pressure 20 bar, max. Temperatures150 degree oC . Connection - Flange PN16",
    specifications: {
      material: "SS304",
      body: "CF8 casting",
      ballAndStem: "CF8/304",
      seat: "PTFE",
      pressure: "20 bar",
      maxTemperature: "150°C",
      connection: "Flange PN16",
      size: "DN 40",
      pressureRating: "PN 16",
      origin: "China-Imported"
    },
    unit: "pcs"
  },
  {
    name: "Thread type ball valve (DN 25)",
    brand: "HICO",
    modelName: "DN 25 NPT",
    description: "2 Pcs Stainless steel Ball Valve,1000WOG, Body CF8, stem:304,ball:304,seat:PTFE, PN16 max. Temp 100 degree, Connection ends NPT",
    specifications: {
      material: "Stainless steel",
      body: "CF8",
      stem: "304",
      ball: "304",
      seat: "PTFE",
      pressure: "1000WOG",
      pressureRating: "PN16",
      maxTemperature: "100°C",
      connection: "NPT",
      size: "DN 25",
      origin: "China",
      brand: "HICO"
    },
    unit: "pcs"
  },
  {
    name: "Thread type ball valve (DN 20)",
    brand: "HICO",
    modelName: "DN 20 NPT",
    description: "2 Pcs Stainless steel Ball Valve,1000WOG, Body CF8, stem:304,ball:304,seat:PTFE, PN16 max. Temp 100 degree, Connection ends NPT",
    specifications: {
      material: "Stainless steel",
      body: "CF8",
      stem: "304",
      ball: "304",
      seat: "PTFE",
      pressure: "1000WOG",
      pressureRating: "PN16",
      maxTemperature: "100°C",
      connection: "NPT",
      size: "DN 20",
      origin: "China",
      brand: "HICO"
    },
    unit: "pcs"
  },
  {
    name: "Thread type ball valve (DN 15)",
    brand: "HICO",
    modelName: "DN 15 NPT",
    description: "2 Pcs Stainless steel Ball Valve,1000WOG, Body CF8, stem:304,ball:304,seat:PTFE, PN16 max. Temp 100 degree, Connection ends NPT",
    specifications: {
      material: "Stainless steel",
      body: "CF8",
      stem: "304",
      ball: "304",
      seat: "PTFE",
      pressure: "1000WOG",
      pressureRating: "PN16",
      maxTemperature: "100°C",
      connection: "NPT",
      size: "DN 15",
      origin: "China",
      brand: "HICO"
    },
    unit: "pcs"
  }
];

async function addBallValves() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create Ball Valves category
    let ballValveCategory = await Category.findOne({ name: 'Ball Valves' });
    if (!ballValveCategory) {
      ballValveCategory = await Category.create({
        name: 'Ball Valves',
        description: 'Industrial ball valves for fluid control',
        attributes: ['size', 'pressure', 'material', 'connection', 'temperature'],
        isActive: true
      });
      console.log('Created Ball Valves category');
    }

    // Find or create Optimech vendor
    let optimechVendor = await Vendor.findOne({ companyName: 'Optimech' });
    if (!optimechVendor) {
      optimechVendor = await Vendor.create({
        companyName: 'Optimech',
        contactPerson: 'Sales Representative',
        email: 'sales@optimech.com',
        phone: '+880-1234567890',
        address: {
          street: 'Industrial Area',
          city: 'Dhaka',
          state: 'Dhaka',
          country: 'Bangladesh',
          zipCode: '1000'
        },
        specialties: ['Ball Valves', 'Industrial Valves'],
        paymentTerms: '30 days',
        deliveryTime: '7-10 days',
        reliability: 4,
        isActive: true
      });
      console.log('Created Optimech vendor');
    }

    // Find or create HICO vendor
    let hicoVendor = await Vendor.findOne({ companyName: 'HICO' });
    if (!hicoVendor) {
      hicoVendor = await Vendor.create({
        companyName: 'HICO',
        contactPerson: 'Sales Representative',
        email: 'sales@hico.com',
        phone: '+86-1234567890',
        address: {
          street: 'Industrial Zone',
          city: 'Shanghai',
          state: 'Shanghai',
          country: 'China',
          zipCode: '200000'
        },
        specialties: ['Ball Valves', 'Industrial Valves', 'Stainless Steel Valves'],
        paymentTerms: '30 days',
        deliveryTime: '15-20 days',
        reliability: 4,
        isActive: true
      });
      console.log('Created HICO vendor');
    }

    // Add products
    for (const productData of ballValveProducts) {
      // Check if product already exists
      const existingProduct = await Product.findOne({ 
        name: productData.name,
        brand: productData.brand 
      });

      if (existingProduct) {
        console.log(`Product already exists: ${productData.name}`);
        continue;
      }

      // Determine vendor based on brand
      const vendor = productData.brand === 'Optimech' ? optimechVendor : hicoVendor;

      // Create product with vendor pricing
      const product = await Product.create({
        ...productData,
        category: ballValveCategory._id,
        vendorPrices: [{
          vendor: vendor._id,
          price: 0, // Price to be updated later
          currency: 'BDT',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          minimumQuantity: 1,
          deliveryTime: vendor.deliveryTime,
          lastUpdated: new Date()
        }]
      });

      console.log(`Added product: ${product.name}`);
    }

    console.log('All ball valve products have been added successfully!');
    
  } catch (error) {
    console.error('Error adding ball valve products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addBallValves();
