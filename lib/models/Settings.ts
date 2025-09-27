import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  company: {
    companyName: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
    contact: {
      email: string;
      phone: string;
      website: string;
    };
    logo: string;
    bin: string;
  };
  quotation: {
    authorizedBy: {
      name: string;
      designation: string;
    };
  };
  pricing: {
    defaultProfitMargin: number;
    showVendorCosts: boolean;
    allowNegativeMargins: boolean;
    roundPrices: boolean;
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  company: {
    companyName: { type: String, required: true },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: 'Dhaka' },
      state: { type: String, default: 'Dhaka' },
      country: { type: String, default: 'Bangladesh' },
      zipCode: { type: String, default: '' },
    },
    contact: {
      email: { type: String, default: 'info@steelroottraders.com' },
      phone: { type: String, default: '+880-2-123456789' },
      website: { type: String, default: 'www.steelroottraders.com' },
    },
    logo: { type: String, default: '' },
    bin: { type: String, default: '' },
  },
  quotation: {
    authorizedBy: {
      name: { type: String, required: true },
      designation: { type: String, required: true },
    },
  },
  pricing: {
    defaultProfitMargin: { type: Number, default: 20 },
    showVendorCosts: { type: Boolean, default: false },
    allowNegativeMargins: { type: Boolean, default: false },
    roundPrices: { type: Boolean, default: true },
    currency: { type: String, default: 'BDT' },
  },
}, {
  timestamps: true,
  strict: true,
});

export const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
