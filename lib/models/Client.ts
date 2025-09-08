import mongoose, { Schema, Document } from 'mongoose';

export interface IClientContact {
  name: string;
  title: string;
  email: string;
  phone: string;
  department: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface IClient extends Document {
  companyName: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  industry: string;
  taxId: string;
  paymentTerms: string;
  creditLimit: number;
  contacts: IClientContact[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientContactSchema = new Schema<IClientContact>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
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
  department: {
    type: String,
    trim: true,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const ClientSchema = new Schema<IClient>({
  companyName: {
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
  industry: {
    type: String,
    trim: true,
  },
  taxId: {
    type: String,
    trim: true,
  },
  paymentTerms: {
    type: String,
    trim: true,
    default: '30 days',
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0,
  },
  contacts: [ClientContactSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
ClientSchema.index({ companyName: 1 });
ClientSchema.index({ 'contacts.email': 1 });
ClientSchema.index({ industry: 1 });
ClientSchema.index({ isActive: 1 });

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
