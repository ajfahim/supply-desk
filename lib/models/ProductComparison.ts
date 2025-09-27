import mongoose, { Schema, Document } from 'mongoose';

export interface IComparisonItem {
  brand: string;
  model: string;
  specifications: string;
  price: number;
  currency: string;
  image?: string; // Base64 encoded image data
  notes?: string;
}

export interface IProductComparison {
  productName: string;
  productId?: mongoose.Types.ObjectId;
  items: IComparisonItem[];
}

export interface IComparisonReport extends Document {
  title: string;
  clientName?: string;
  requirementId?: string;
  comparisons: IProductComparison[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ComparisonItemSchema = new Schema<IComparisonItem>({
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: false,
    trim: true,
    default: '',
  },
  specifications: {
    type: String,
    required: true,
    trim: true,
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
  image: {
    type: String, // Base64 encoded image
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
});

const ProductComparisonSchema = new Schema<IProductComparison>({
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
  items: [ComparisonItemSchema],
});

const ComparisonReportSchema = new Schema<IComparisonReport>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  clientName: {
    type: String,
    trim: true,
  },
  requirementId: {
    type: String,
    trim: true,
  },
  comparisons: [ProductComparisonSchema],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
ComparisonReportSchema.index({ createdBy: 1 });
ComparisonReportSchema.index({ createdAt: -1 });
ComparisonReportSchema.index({ title: 'text' });

export const ComparisonReport = mongoose.models.ComparisonReport || mongoose.model<IComparisonReport>('ComparisonReport', ComparisonReportSchema);
