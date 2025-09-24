import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Vendor from '@/lib/models/Vendor';
import { PricingCalculator } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { productId, profitMargin } = await request.json();
    
    if (!productId || profitMargin === undefined) {
      return NextResponse.json(
        { error: 'Product ID and profit margin are required' },
        { status: 400 }
      );
    }

    // Fetch product with vendor prices populated
    const product = await Product.findById(productId)
      .populate('vendorPrices.vendor', 'companyName')
      .lean();

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Filter out expired vendor prices and add vendor names
    const currentDate = new Date();
    const validVendorPrices = (product as any).vendorPrices
      .filter((vp: any) => new Date(vp.validUntil) > currentDate)
      .map((vp: any) => ({
        ...vp,
        vendorName: vp.vendor.companyName
      }));

    if (validVendorPrices.length === 0) {
      return NextResponse.json(
        { error: 'No valid vendor prices found for this product' },
        { status: 404 }
      );
    }

    // Calculate vendor comparisons
    const comparisons = PricingCalculator.compareVendorPrices(
      validVendorPrices,
      profitMargin,
      true // round prices
    );

    return NextResponse.json({
      product: {
        _id: (product as any)._id,
        name: (product as any).name,
        brand: (product as any).brand,
        modelName: (product as any).modelName
      },
      comparisons,
      profitMargin,
      analysisDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in vendor comparison:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const minPriceVariance = parseFloat(searchParams.get('minPriceVariance') || '10');
    
    // Build query
    const query: any = {
      'vendorPrices.1': { $exists: true } // At least 2 vendor prices
    };
    
    if (categoryId) {
      query.category = categoryId;
    }

    // Find products with multiple vendor prices
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('vendorPrices.vendor', 'companyName')
      .lean();

    // Analyze price variance for each product
    const analysisResults = products.map((product: any) => {
      const validPrices = product.vendorPrices
        .filter((vp: any) => new Date(vp.validUntil) > new Date())
        .map((vp: any) => vp.price);

      if (validPrices.length < 2) return null;

      const minPrice = Math.min(...validPrices);
      const maxPrice = Math.max(...validPrices);
      const priceVariance = ((maxPrice - minPrice) / minPrice) * 100;

      if (priceVariance < minPriceVariance) return null;

      return {
        product: {
          _id: product._id,
          name: product.name,
          brand: product.brand,
          modelName: product.modelName,
          category: product.category.name
        },
        priceVariance: Math.round(priceVariance * 100) / 100,
        minPrice,
        maxPrice,
        vendorCount: validPrices.length,
        potentialSavings: maxPrice - minPrice
      };
    }).filter(Boolean);

    // Sort by price variance (highest first)
    analysisResults.sort((a: any, b: any) => b.priceVariance - a.priceVariance);

    return NextResponse.json({
      products: analysisResults,
      summary: {
        totalProducts: analysisResults.length,
        averageVariance: analysisResults.length > 0 
          ? analysisResults.reduce((sum: number, item: any) => sum + item.priceVariance, 0) / analysisResults.length
          : 0,
        totalPotentialSavings: analysisResults.reduce((sum: number, item: any) => sum + item.potentialSavings, 0)
      }
    });

  } catch (error) {
    console.error('Error in vendor comparison analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
