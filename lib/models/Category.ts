import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  parentCategory?: mongoose.Types.ObjectId;
  attributes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
  attributes: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
CategorySchema.index({ name: 1 });
CategorySchema.index({ parentCategory: 1 });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
