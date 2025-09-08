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
    taxId: string;
  };
  quotation: {
    defaultValidityDays: number;
    defaultTaxRate: number;
    defaultPaymentTerms: string;
    defaultDeliveryTerms: string;
    defaultWarranty: string;
    quotationPrefix: string;
    autoNumbering: boolean;
  };
  pricing: {
    defaultProfitMargin: number;
    showVendorCosts: boolean;
    allowNegativeMargins: boolean;
    roundPrices: boolean;
    currency: string;
  };
  notifications: {
    emailNotifications: boolean;
    quotationExpiry: boolean;
    lowStock: boolean;
    newOrders: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  company: {
    companyName: { type: String, default: 'Steelroot Traders' },
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
    taxId: { type: String, default: '' },
  },
  quotation: {
    defaultValidityDays: { type: Number, default: 15 },
    defaultTaxRate: { type: Number, default: 15 },
    defaultPaymentTerms: { type: String, default: '50% Advance with Work order, rest after delivery' },
    defaultDeliveryTerms: { type: String, default: 'Delivery time: Supply 3-5 days After Getting PO' },
    defaultWarranty: { type: String, default: '1 year manufacturer warranty' },
    quotationPrefix: { type: String, default: 'SRT' },
    autoNumbering: { type: Boolean, default: true },
  },
  pricing: {
    defaultProfitMargin: { type: Number, default: 20 },
    showVendorCosts: { type: Boolean, default: false },
    allowNegativeMargins: { type: Boolean, default: false },
    roundPrices: { type: Boolean, default: true },
    currency: { type: String, default: 'BDT' },
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    quotationExpiry: { type: Boolean, default: true },
    lowStock: { type: Boolean, default: false },
    newOrders: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
