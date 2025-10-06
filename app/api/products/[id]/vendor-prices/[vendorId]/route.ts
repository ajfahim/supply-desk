import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/lib/models';
import mongoose from 'mongoose';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vendorId: string }> }
) {
  try {
    await connectDB();
    
    const { id, vendorId } = await params;
    
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
    
    // Remove vendor price
    product.vendorPrices = product.vendorPrices.filter(
      (vp: any) => vp.vendor.toString() !== vendorId
    );
    
    await product.save();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vendor price:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor price' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vendorId: string }> }
) {
  try {
    await connectDB();
    
    const { id, vendorId } = await params;
    const body = await request.json();
    const { price, validUntil } = body;
    
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
    
    // Validate required fields
    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
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
    
    // Find and update vendor price
    const vendorPriceIndex = product.vendorPrices.findIndex(
      (vp: any) => vp.vendor.toString() === vendorId
    );
    
    if (vendorPriceIndex === -1) {
      product.vendorPrices.push({
        vendor: new mongoose.Types.ObjectId(vendorId),
        price: Number(price),
        currency: body.currency || 'BDT',
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
        minimumQuantity: Number(body.minimumQuantity) || 1,
        deliveryTime: body.deliveryTime || '',
        lastUpdated: new Date()
      });
    } else {
      product.vendorPrices[vendorPriceIndex] = {
        ...product.vendorPrices[vendorPriceIndex],
        price: Number(price),
        currency: body.currency || product.vendorPrices[vendorPriceIndex].currency,
        validUntil: validUntil ? new Date(validUntil) : product.vendorPrices[vendorPriceIndex].validUntil,
        minimumQuantity: body.minimumQuantity ? Number(body.minimumQuantity) : product.vendorPrices[vendorPriceIndex].minimumQuantity,
        deliveryTime: body.deliveryTime !== undefined ? body.deliveryTime : product.vendorPrices[vendorPriceIndex].deliveryTime,
        lastUpdated: new Date()
      };
    }
    
    await product.save();
    
    // Populate vendor details for response
    await product.populate('vendorPrices.vendor');
    
    return NextResponse.json(product.vendorPrices[vendorPriceIndex]);
  } catch (error) {
    console.error('Error updating vendor price:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor price' },
      { status: 500 }
    );
  }
}
