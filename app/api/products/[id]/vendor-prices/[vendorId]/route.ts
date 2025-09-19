import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/lib/models';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; vendorId: string } }
) {
  try {
    await connectDB();
    
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Remove vendor price
    product.vendorPrices = product.vendorPrices.filter(
      (vp: any) => vp.vendor.toString() !== params.vendorId
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
  { params }: { params: { id: string; vendorId: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { price, currency, validUntil, minimumQuantity, deliveryTime } = body;
    
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Find and update vendor price
    const vendorPriceIndex = product.vendorPrices.findIndex(
      (vp: any) => vp.vendor.toString() === params.vendorId
    );
    
    if (vendorPriceIndex === -1) {
      return NextResponse.json(
        { error: 'Vendor price not found' },
        { status: 404 }
      );
    }
    
    product.vendorPrices[vendorPriceIndex] = {
      ...product.vendorPrices[vendorPriceIndex],
      price,
      currency: currency || 'BDT',
      validUntil: new Date(validUntil),
      minimumQuantity: minimumQuantity || 1,
      deliveryTime: deliveryTime || '',
      lastUpdated: new Date(),
    };
    
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
