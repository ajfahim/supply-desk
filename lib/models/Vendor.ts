import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  specialties: string[];
  paymentTerms: string;
  deliveryTime: string;
  reliability: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>({
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true },
  },
  specialties: [{
    type: String,
    trim: true,
  }],
  paymentTerms: {
    type: String,
    trim: true,
  },
  deliveryTime: {
    type: String,
    trim: true,
  },
  reliability: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
VendorSchema.index({ companyName: 1 });
VendorSchema.index({ email: 1 });
VendorSchema.index({ specialties: 1 });
VendorSchema.index({ isActive: 1 });

export default mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);
