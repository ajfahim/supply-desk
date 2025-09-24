import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  brand: string;
  modelName: string;
  specifications?: {
    [key: string]: any;
  };
  quantity: number;
  unit: string;
  unitPrice: number;
  sellingPrice: number;
  lineTotal: number;
  deliveryTime: string;
  warranty: string;
  notes: string;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  quotation: mongoose.Types.ObjectId;
  quotationNumber: string;
  purchaseOrderNumber: string;
  client: mongoose.Types.ObjectId;
  clientContact: mongoose.Types.ObjectId;
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  transportationCost: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  deliveryTerms: string;
  paymentTerms: string;
  warranty: string;
  termsAndInstructions: string;
  notes: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  paidAmount?: number;
  createdBy: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
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
    min: 0,
  },
  unit: {
    type: String,
    required: true,
    trim: true,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
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

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  quotation: {
    type: Schema.Types.ObjectId,
    ref: 'Quotation',
    required: true,
  },
  quotationNumber: {
    type: String,
    required: true,
    trim: true,
  },
  purchaseOrderNumber: {
    type: String,
    required: true,
    trim: true,
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
  items: [InvoiceItemSchema],
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
    required: true,
    min: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  deliveryTerms: {
    type: String,
    trim: true,
  },
  paymentTerms: {
    type: String,
    trim: true,
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
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  dueDate: {
    type: Date,
    required: true,
  },
  paidDate: {
    type: Date,
  },
  paidAmount: {
    type: Number,
    min: 0,
  },
  createdBy: {
    type: String,
    required: true,
    trim: true,
  },
  version: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
InvoiceSchema.index({ quotation: 1 });
InvoiceSchema.index({ client: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ createdAt: -1 });

// Text search index
InvoiceSchema.index({
  invoiceNumber: 'text',
  quotationNumber: 'text',
  purchaseOrderNumber: 'text',
});

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
