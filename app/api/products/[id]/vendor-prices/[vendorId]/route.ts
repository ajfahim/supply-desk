import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/lib/models';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vendorId: string }> }
) {
  try {
    await connectDB();
    
    const { id, vendorId } = await params;
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
        vendor: vendorId,
        price,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        updatedAt: new Date()
      });
    } else {
      product.vendorPrices[vendorPriceIndex] = {
        ...product.vendorPrices[vendorPriceIndex],
        price,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        updatedAt: new Date()
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
