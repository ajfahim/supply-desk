import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Product } from '@/lib/models/Product';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectDB();

    let products;
    
    if (query.trim()) {
      // Search products by name, brand, or model
      products = await Product.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { brand: { $regex: query, $options: 'i' } },
          { modelName: { $regex: query, $options: 'i' } }
        ]
      })
      .populate('category', 'name')
      .limit(limit)
      .select('name brand modelName description specifications unit category')
      .sort({ name: 1 });
    } else {
      // Return recent products if no search query
      products = await Product.find({})
        .populate('category', 'name')
        .limit(limit)
        .select('name brand modelName description specifications unit category')
        .sort({ createdAt: -1 });
    }

    // Format products for dropdown
    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      brand: product.brand || '',
      model: product.modelName || '',
      description: product.description || '',
      specifications: product.specifications || {},
      unit: product.unit || 'pcs',
      category: product.category?.name || '',
      displayName: `${product.name}${product.brand ? ` - ${product.brand}` : ''}${product.modelName ? ` (${product.modelName})` : ''}`
    }));

    return NextResponse.json(formattedProducts);

  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
