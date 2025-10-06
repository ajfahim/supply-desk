import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/lib/models';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { vendor: vendorId, price, validUntil } = body;
    
    // Validate required fields
    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }
    
    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      );
    }
    
    if (!validUntil) {
      return NextResponse.json(
        { error: 'Valid until date is required' },
        { status: 400 }
      );
    }
    
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return NextResponse.json(
        { error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if vendor price already exists
    const existingPriceIndex = product.vendorPrices.findIndex(
      (vp: any) => vp.vendor.toString() === vendorId
    );
    
    const newVendorPrice = {
      vendor: new mongoose.Types.ObjectId(vendorId),
      price: Number(price),
      currency: body.currency || 'BDT',
      validUntil: new Date(validUntil),
      minimumQuantity: Number(body.minimumQuantity) || 1,
      deliveryTime: body.deliveryTime || '',
      lastUpdated: new Date(),
    };
    
    if (existingPriceIndex >= 0) {
      // Update existing price
      product.vendorPrices[existingPriceIndex] = newVendorPrice;
    } else {
      // Add new price
      product.vendorPrices.push(newVendorPrice);
    }
    
    await product.save();
    
    // Populate vendor details for response
    await product.populate('vendorPrices.vendor');
    
    return NextResponse.json(product.vendorPrices);
  } catch (error) {
    console.error('Error adding/updating vendor price:', error);
    
    // Handle validation errors specifically
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.message,
          validationErrors: (error as any).errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to add/update vendor price',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const product = await Product.findById(id)
      .populate('vendorPrices.vendor', 'companyName')
      .select('vendorPrices');
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product.vendorPrices);
  } catch (error) {
    console.error('Error fetching vendor prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor prices' },
      { status: 500 }
    );
  }
}
