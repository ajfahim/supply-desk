import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/lib/models';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { vendor, price, currency, validUntil, minimumQuantity, deliveryTime } = body;
    
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if vendor price already exists
    const existingPriceIndex = product.vendorPrices.findIndex(
      (vp: any) => vp.vendor.toString() === vendor
    );
    
    const newVendorPrice = {
      vendor,
      price,
      currency: currency || 'BDT',
      validUntil: new Date(validUntil),
      minimumQuantity: minimumQuantity || 1,
      deliveryTime: deliveryTime || '',
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
    return NextResponse.json(
      { error: 'Failed to add/update vendor price' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const product = await Product.findById(params.id)
      .populate('vendorPrices.vendor')
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
