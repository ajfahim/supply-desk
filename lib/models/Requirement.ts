import mongoose, { Schema, Document } from 'mongoose';

export interface IRequirementItem {
  productName: string;
  specifications: Record<string, any>;
  quantity: number;
  urgency: 'low' | 'medium' | 'high';
  notes: string;
}

export interface IRequirement extends Document {
  client: mongoose.Types.ObjectId;
  title: string;
  description: string;
  items: IRequirementItem[];
  deadline: Date;
  status: 'received' | 'sourcing' | 'quoted' | 'won' | 'lost';
  createdAt: Date;
  updatedAt: Date;
}

const RequirementItemSchema = new Schema<IRequirementItem>({
  productName: {
    type: String,
    required: true,
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
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  notes: {
    type: String,
    trim: true,
  },
});

const RequirementSchema = new Schema<IRequirement>({
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  items: [RequirementItemSchema],
  deadline: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['received', 'sourcing', 'quoted', 'won', 'lost'],
    default: 'received',
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
RequirementSchema.index({ client: 1 });
RequirementSchema.index({ status: 1 });
RequirementSchema.index({ deadline: 1 });
RequirementSchema.index({ createdAt: -1 });

export default mongoose.models.Requirement || mongoose.model<IRequirement>('Requirement', RequirementSchema);
