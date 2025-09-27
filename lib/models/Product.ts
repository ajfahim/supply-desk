import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorPrice {
  vendor: mongoose.Types.ObjectId;
  price: number;
  currency: string;
  validUntil: Date;
  minimumQuantity: number;
  deliveryTime: string;
  lastUpdated: Date;
}

export interface IProduct extends Document {
  name: string;
  brand: string;
  modelName: string;
  category: mongoose.Types.ObjectId;
  description: string;
  specifications: {
    dimensions?: string;
    weight?: string;
    material?: string;
    operatingVoltage?: string;
    operatingTemperature?: string;
    pressure?: string;
    capacity?: string;
    power?: string;
    certification?: string[];
    origin?: string;
    [key: string]: any;
  };
  unit: string;
  images: string[];
  hsCode: string;
  vendorPrices: IVendorPrice[];
  createdAt: Date;
  updatedAt: Date;
}

const VendorPriceSchema = new Schema<IVendorPrice>({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    default: 'BDT',
  },
  validUntil: {
    type: Date,
    required: true,
  },
  minimumQuantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  deliveryTime: {
    type: String,
    trim: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    trim: true,
  },
  modelName: {
    type: String,
    trim: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  specifications: {
    type: Schema.Types.Mixed,
    default: {},
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    default: 'pcs',
  },
  images: [{
    type: String,
    trim: true,
  }],
  hsCode: {
    type: String,
    trim: true,
  },
  vendorPrices: [VendorPriceSchema],
}, {
  timestamps: true,
});

// Indexes for efficient querying
ProductSchema.index({ name: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ model: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ 'vendorPrices.vendor': 1 });
ProductSchema.index({ 'vendorPrices.price': 1 });

// Text search index
ProductSchema.index({
  name: 'text',
  brand: 'text',
  model: 'text',
  description: 'text',
});

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
