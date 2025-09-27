import mongoose from 'mongoose';

export interface ChalanItem {
  _id?: string;
  productName: string;
  product: mongoose.Types.ObjectId;
  specifications?: {
    [key: string]: string | number | boolean;
  };
  quantity: number;
  unit: string;
  deliveryTime?: string;
  warranty?: string;
  notes?: string;
}

export interface Chalan extends mongoose.Document {
  _id: string;
  chalanNumber: string;
  invoice?: mongoose.Types.ObjectId; // Reference to invoice
  client: mongoose.Types.ObjectId;
  clientContact: {
    _id: string;
    name: string;
    title: string;
    email: string;
    phone?: string;
  };
  items: ChalanItem[];
  deliveryAddress: string;
  deliveryDate: Date;
  transportationDetails: {
    method: string;
    cost: number;
    carrier?: string;
    trackingNumber?: string;
  };
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  receivedBy?: {
    name: string;
    designation: string;
    signature?: string;
    receivedDate?: Date;
  };
  status: 'draft' | 'dispatched' | 'delivered' | 'received';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChalan extends mongoose.Document {
  chalanNumber: string;
  invoice?: mongoose.Types.ObjectId; // Reference to invoice
  client: mongoose.Types.ObjectId;
  clientContact: {
    name: string;
    title: string;
    phone?: string;
    email?: string;
  };
  items: ChalanItem[];
  deliveryAddress: string;
  transportationDetails: {
    method: string;
    cost: number;
    carrier?: string;
    trackingNumber?: string;
  };
  status: 'draft' | 'dispatched' | 'delivered' | 'received';
  dispatchDate?: Date;
  deliveryDate?: Date;
  receivedBy?: {
    name: string;
    signature?: string;
    date: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChalanItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  specifications: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  },
  deliveryTime: String,
  warranty: String,
  notes: String
});

const ChalanSchema = new mongoose.Schema({
  chalanNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  clientContact: {
    name: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    phone: String,
    email: String
  },
  items: [ChalanItemSchema],
  deliveryAddress: {
    type: String,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  transportationDetails: {
    method: String,
    cost: Number,
    carrier: String,
    trackingNumber: String
  },
  driverName: { type: String },
  driverPhone: { type: String },
  vehicleNumber: { type: String },
  receivedBy: {
    name: String,
    designation: String,
    signature: String,
    receivedDate: Date
  },
  status: {
    type: String,
    enum: ['draft', 'dispatched', 'delivered', 'received'],
    default: 'draft'
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Chalan = mongoose.models.Chalan || mongoose.model<IChalan>('Chalan', ChalanSchema);
