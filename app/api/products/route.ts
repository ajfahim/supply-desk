import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product, Category } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter: any = {};
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }
    
    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('vendorPrices.vendor', 'companyName')
      .sort(search ? { score: { $meta: 'textScore' } } : { name: 1 });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const product = new Product(body);
    await product.save();
    
    await product.populate('category', 'name');
    await product.populate('vendorPrices.vendor', 'companyName');
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
