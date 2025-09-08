const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define schemas directly in the seeder
const { Schema } = mongoose;

const CategorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  parentCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
  attributes: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

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

const VendorPriceSchema = new Schema({
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'BDT' },
  validUntil: { type: Date, required: true },
  minimumQuantity: { type: Number, default: 1, min: 1 },
  deliveryTime: { type: String, trim: true },
  lastUpdated: { type: Date, default: Date.now },
});

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

const ClientContactSchema = new Schema({
  name: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  isPrimary: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});

const ClientSchema = new Schema({
  companyName: { type: String, required: true, trim: true },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true },
  },
  industry: { type: String, trim: true },
  taxId: { type: String, trim: true },
  paymentTerms: { type: String, trim: true, default: '30 days' },
  creditLimit: { type: Number, default: 0, min: 0 },
  contacts: [ClientContactSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Create models
const Category = mongoose.model('Category', CategorySchema);
const Vendor = mongoose.model('Vendor', VendorSchema);
const Product = mongoose.model('Product', ProductSchema);
const Client = mongoose.model('Client', ClientSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supply-desk';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Vendor.deleteMany({});
    await Product.deleteMany({});
    await Client.deleteMany({});
    console.log('Cleared existing data');

    // Create Categories
    const categories = await Category.insertMany([
      {
        name: 'Sensors',
        description: 'Industrial sensors and detection equipment',
        attributes: ['Operating Voltage', 'Detection Range', 'Output Type', 'Protection Rating'],
      },
      {
        name: 'Hydraulic Equipment',
        description: 'Hydraulic cylinders, pumps, and accessories',
        attributes: ['Pressure Rating', 'Bore Size', 'Stroke Length', 'Operating Temperature'],
      },
      {
        name: 'Motors & Drives',
        description: 'Electric motors and variable frequency drives',
        attributes: ['Power Rating', 'Voltage', 'Speed', 'Efficiency Rating'],
      },
      {
        name: 'Valves',
        description: 'Industrial valves and flow control equipment',
        attributes: ['Valve Type', 'Size', 'Pressure Rating', 'Material'],
      },
    ]);

    console.log('Created categories');

    // Create Vendors
    const vendors = await Vendor.insertMany([
      {
        companyName: 'Omron Bangladesh Ltd',
        contactPerson: 'Md. Rahman',
        email: 'rahman@omron.com.bd',
        phone: '+880-2-9876543',
        address: {
          street: '123 Industrial Area',
          city: 'Dhaka',
          state: 'Dhaka Division',
          country: 'Bangladesh',
          zipCode: '1000',
        },
        specialties: ['Sensors', 'Automation Equipment'],
        paymentTerms: '30 days',
        deliveryTime: '7-10 days',
        reliability: 5,
      },
      {
        companyName: 'Hydraulics International',
        contactPerson: 'John Smith',
        email: 'john@hydraulics-intl.com',
        phone: '+880-2-1234567',
        address: {
          street: '456 Engineering Road',
          city: 'Chittagong',
          state: 'Chittagong Division',
          country: 'Bangladesh',
          zipCode: '4000',
        },
        specialties: ['Hydraulic Equipment', 'Cylinders'],
        paymentTerms: '45 days',
        deliveryTime: '14-21 days',
        reliability: 4,
      },
      {
        companyName: 'Motor Tech Solutions',
        contactPerson: 'Sarah Ahmed',
        email: 'sarah@motortech.com.bd',
        phone: '+880-2-5555555',
        address: {
          street: '789 Technology Park',
          city: 'Dhaka',
          state: 'Dhaka Division',
          country: 'Bangladesh',
          zipCode: '1200',
        },
        specialties: ['Motors', 'Drives', 'Electrical Equipment'],
        paymentTerms: '30 days',
        deliveryTime: '10-15 days',
        reliability: 4,
      },
    ]);

    console.log('Created vendors');

    // Create Products
    const products = await Product.insertMany([
      {
        name: 'Proximity Sensor E2E-X5ME1',
        brand: 'Omron',
        modelName: 'E2E-X5ME1',
        category: categories[0]._id, // Sensors
        description: 'Inductive proximity sensor with M18 thread',
        specifications: {
          dimensions: '18mm diameter x 65mm length',
          operatingVoltage: '12-24V DC',
          detectionRange: '5mm',
          outputType: 'NPN/PNP',
          operatingTemperature: '-25°C to +70°C',
          protection: 'IP67',
          certification: ['CE', 'UL'],
          origin: 'Japan',
        },
        unit: 'pcs',
        hsCode: '8536.50.90',
        vendorPrices: [
          {
            vendor: vendors[0]._id,
            price: 2500,
            currency: 'BDT',
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            minimumQuantity: 1,
            deliveryTime: '7-10 days',
            lastUpdated: new Date(),
          },
        ],
      },
      {
        name: 'Hydraulic Cylinder HC-100-50-200',
        brand: 'Parker',
        modelName: 'HC-100-50-200',
        category: categories[1]._id, // Hydraulic Equipment
        description: 'Double acting hydraulic cylinder',
        specifications: {
          boreSize: '100mm',
          rodDiameter: '50mm',
          strokeLength: '200mm',
          pressure: '210 bar',
          operatingTemperature: '-20°C to +80°C',
          material: 'Steel',
          certification: ['ISO 6020/2'],
          origin: 'Germany',
        },
        unit: 'pcs',
        hsCode: '8412.21.00',
        vendorPrices: [
          {
            vendor: vendors[1]._id,
            price: 15000,
            currency: 'BDT',
            validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            minimumQuantity: 1,
            deliveryTime: '14-21 days',
            lastUpdated: new Date(),
          },
        ],
      },
      {
        name: 'AC Motor 3-Phase 5HP',
        brand: 'Siemens',
        modelName: '1LE1001-1CB23-4AA4',
        category: categories[2]._id, // Motors & Drives
        description: '3-phase induction motor, 5HP, 1500 RPM',
        specifications: {
          power: '3.7kW (5HP)',
          voltage: '415V',
          frequency: '50Hz',
          speed: '1500 RPM',
          efficiency: 'IE3',
          protection: 'IP55',
          mounting: 'B3 (foot mounted)',
          certification: ['CE', 'IEC'],
          origin: 'Germany',
        },
        unit: 'pcs',
        hsCode: '8501.52.00',
        vendorPrices: [
          {
            vendor: vendors[2]._id,
            price: 45000,
            currency: 'BDT',
            validUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
            minimumQuantity: 1,
            deliveryTime: '10-15 days',
            lastUpdated: new Date(),
          },
        ],
      },
      {
        name: 'Ball Valve 2 inch',
        brand: 'Kitz',
        modelName: 'KITZ-600-2',
        category: categories[3]._id, // Valves
        description: '2-inch stainless steel ball valve',
        specifications: {
          size: '2 inch (50mm)',
          material: 'Stainless Steel 316',
          pressure: '600 PSI',
          temperature: '-20°C to +200°C',
          connection: 'Threaded NPT',
          operation: 'Manual lever',
          certification: ['API 6D', 'ISO 17292'],
          origin: 'Japan',
        },
        unit: 'pcs',
        hsCode: '8481.80.19',
        vendorPrices: [
          {
            vendor: vendors[0]._id,
            price: 8500,
            currency: 'BDT',
            validUntil: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
            minimumQuantity: 1,
            deliveryTime: '7-10 days',
            lastUpdated: new Date(),
          },
        ],
      },
    ]);

    console.log('Created products');

    // Create Clients
    const clients = await Client.insertMany([
      {
        companyName: 'Bangladesh Steel Mills Corporation',
        address: {
          street: '1 Steel Mill Road',
          city: 'Chittagong',
          state: 'Chittagong Division',
          country: 'Bangladesh',
          zipCode: '4100',
        },
        industry: 'Steel Manufacturing',
        taxId: 'VAT-123456789',
        paymentTerms: '45 days',
        creditLimit: 1000000,
        contacts: [
          {
            name: 'Md. Karim Ahmed',
            title: 'Procurement Manager',
            email: 'karim.ahmed@bsmc.gov.bd',
            phone: '+880-31-2345678',
            department: 'Procurement',
            isPrimary: true,
            isActive: true,
          },
          {
            name: 'Fatima Rahman',
            title: 'Assistant Procurement Officer',
            email: 'fatima.rahman@bsmc.gov.bd',
            phone: '+880-31-2345679',
            department: 'Procurement',
            isPrimary: false,
            isActive: true,
          },
        ],
      },
      {
        companyName: 'Dhaka Textile Mills Ltd',
        address: {
          street: '25 Textile Avenue',
          city: 'Dhaka',
          state: 'Dhaka Division',
          country: 'Bangladesh',
          zipCode: '1300',
        },
        industry: 'Textile Manufacturing',
        taxId: 'VAT-987654321',
        paymentTerms: '30 days',
        creditLimit: 500000,
        contacts: [
          {
            name: 'Rashid Hassan',
            title: 'Chief Engineer',
            email: 'rashid.hassan@dtml.com',
            phone: '+880-2-9876543',
            department: 'Engineering',
            isPrimary: true,
            isActive: true,
          },
        ],
      },
      {
        companyName: 'Chittagong Port Authority',
        address: {
          street: 'Port Road',
          city: 'Chittagong',
          state: 'Chittagong Division',
          country: 'Bangladesh',
          zipCode: '4000',
        },
        industry: 'Port Operations',
        taxId: 'VAT-456789123',
        paymentTerms: '60 days',
        creditLimit: 2000000,
        contacts: [
          {
            name: 'Nasir Uddin',
            title: 'Procurement Director',
            email: 'nasir.uddin@cpa.gov.bd',
            phone: '+880-31-1111111',
            department: 'Procurement',
            isPrimary: true,
            isActive: true,
          },
          {
            name: 'Salma Begum',
            title: 'Technical Specialist',
            email: 'salma.begum@cpa.gov.bd',
            phone: '+880-31-1111112',
            department: 'Technical',
            isPrimary: false,
            isActive: true,
          },
        ],
      },
    ]);

    console.log('Created clients');
    console.log('Sample data seeded successfully!');
    
    console.log('\n=== SUMMARY ===');
    console.log(`Categories: ${categories.length}`);
    console.log(`Vendors: ${vendors.length}`);
    console.log(`Products: ${products.length}`);
    console.log(`Clients: ${clients.length}`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedData();
