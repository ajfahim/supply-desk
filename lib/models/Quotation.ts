import mongoose, { Schema, Document } from 'mongoose';

export interface IQuotationItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  brand: string;
  modelName: string;
  specifications: Record<string, any>;
  quantity: number;
  unit: string;
  selectedVendor: mongoose.Types.ObjectId;
  vendorName: string;
  vendorCost: number;
  vendorCurrency: string;
  profitMargin: number;
  sellingPrice: number;
  lineTotal: number;
  deliveryTime: string;
  warranty: string;
  notes: string;
}

export interface IProfitSummary {
  totalCost: number;
  totalProfit: number;
  profitPercentage: number;
  marginByItem: {
    itemId: mongoose.Types.ObjectId;
    cost: number;
    profit: number;
    margin: number;
  }[];
}

export interface IQuotation extends Document {
  quotationNumber: string;
  requirement?: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  clientContact: mongoose.Types.ObjectId;
  items: IQuotationItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  transportationCost?: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  validUntil: Date;
  deliveryTerms: string;
  paymentTerms: string;
  warranty: string;
  termsAndInstructions: string;
  notes: string;
  status: 'draft' | 'review' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  sentAt?: Date;
  respondedAt?: Date;
  expiresAt: Date;
  profitSummary: IProfitSummary;
  createdBy: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationItemSchema = new Schema<IQuotationItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
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
  specifications: {
    type: Schema.Types.Mixed,
    default: {},
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit: {
    type: String,
    required: true,
    trim: true,
  },
  selectedVendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  vendorName: {
    type: String,
    required: true,
    trim: true,
  },
  vendorCost: {
    type: Number,
    required: true,
    min: 0,
  },
  vendorCurrency: {
    type: String,
    required: true,
    default: 'BDT',
  },
  profitMargin: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  lineTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  deliveryTime: {
    type: String,
    trim: true,
  },
  warranty: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
});

const ProfitSummarySchema = new Schema<IProfitSummary>({
  totalCost: {
    type: Number,
    required: true,
    min: 0,
  },
  totalProfit: {
    type: Number,
    required: true,
  },
  profitPercentage: {
    type: Number,
    required: true,
  },
  marginByItem: [{
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    profit: {
      type: Number,
      required: true,
    },
    margin: {
      type: Number,
      required: true,
    },
  }],
});

const QuotationSchema = new Schema<IQuotation>({
  quotationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  requirement: {
    type: Schema.Types.ObjectId,
    ref: 'Requirement',
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  clientContact: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  items: [QuotationItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  transportationCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  deliveryTerms: {
    type: String,
    trim: true,
    default: 'FOB Destination',
  },
  paymentTerms: {
    type: String,
    trim: true,
    default: '30 days',
  },
  warranty: {
    type: String,
    trim: true,
  },
  termsAndInstructions: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'sent', 'accepted', 'rejected', 'expired', 'converted'],
    default: 'draft',
  },
  sentAt: {
    type: Date,
  },
  respondedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  profitSummary: ProfitSummarySchema,
  createdBy: {
    type: String,
    required: true,
    trim: true,
  },
  version: {
    type: Number,
    default: 1,
    min: 1,
  },
}, {
  timestamps: true,
});

// Pre-save middleware to generate quotation number
QuotationSchema.pre('save', async function(next) {
  if (this.isNew && !this.quotationNumber) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      // Find the last quotation for today
      const QuotationModel = this.constructor as any;
      const lastQuotation = await QuotationModel.findOne({
        quotationNumber: new RegExp(`^QT-${year}-${month}${day}-`)
      }).sort({ quotationNumber: -1 });
      
      let sequence = 1;
      if (lastQuotation) {
        const lastSequence = parseInt(lastQuotation.quotationNumber.split('-').pop() || '0');
        sequence = lastSequence + 1;
      }
      
      this.quotationNumber = `QT-${year}-${month}${day}-${String(sequence).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating quotation number:', error);
      // Fallback quotation number
      this.quotationNumber = `QT-${Date.now()}`;
    }
  }
  next();
});

// Indexes for efficient querying
QuotationSchema.index({ client: 1 });
QuotationSchema.index({ status: 1 });
QuotationSchema.index({ createdAt: -1 });
QuotationSchema.index({ validUntil: 1 });
QuotationSchema.index({ expiresAt: 1 });

export default mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', QuotationSchema);
