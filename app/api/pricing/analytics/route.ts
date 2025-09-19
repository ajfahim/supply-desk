import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product, Vendor } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const vendorId = searchParams.get('vendorId');
    const category = searchParams.get('category');
    
    // Get price analytics
    const analytics = await getPriceAnalytics(productId, vendorId, category);
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching price analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price analytics' },
      { status: 500 }
    );
  }
}

async function getPriceAnalytics(productId?: string, vendorId?: string, category?: string) {
  const matchStage: any = {};
  
  if (productId) matchStage._id = productId;
  if (category) matchStage.category = category;
  
  const pipeline = [
    { $match: matchStage },
    { $unwind: '$vendorPrices' },
    {
      $lookup: {
        from: 'vendors',
        localField: 'vendorPrices.vendor',
        foreignField: '_id',
        as: 'vendor'
      }
    },
    { $unwind: '$vendor' },
    {
      $match: vendorId ? { 'vendor._id': vendorId } : {}
    },
    {
      $group: {
        _id: null,
        totalProducts: { $addToSet: '$_id' },
        totalVendors: { $addToSet: '$vendor._id' },
        avgPrice: { $avg: '$vendorPrices.price' },
        minPrice: { $min: '$vendorPrices.price' },
        maxPrice: { $max: '$vendorPrices.price' },
        pricesByVendor: {
          $push: {
            vendorId: '$vendor._id',
            vendorName: '$vendor.companyName',
            price: '$vendorPrices.price',
            currency: '$vendorPrices.currency',
            reliability: '$vendor.reliability',
            deliveryTime: '$vendorPrices.deliveryTime'
          }
        }
      }
    },
    {
      $project: {
        totalProducts: { $size: '$totalProducts' },
        totalVendors: { $size: '$totalVendors' },
        avgPrice: { $round: ['$avgPrice', 2] },
        minPrice: 1,
        maxPrice: 1,
        priceRange: { $subtract: ['$maxPrice', '$minPrice'] },
        pricesByVendor: 1
      }
    }
  ];
  
  const result = await Product.aggregate(pipeline);
  
  if (result.length === 0) {
    return {
      totalProducts: 0,
      totalVendors: 0,
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      priceRange: 0,
      bestDeals: [],
      vendorComparison: [],
      recommendations: []
    };
  }
  
  const analytics = result[0];
  
  // Calculate best deals (lowest prices with good reliability)
  const bestDeals = analytics.pricesByVendor
    .filter((item: any) => item.reliability >= 3)
    .sort((a: any, b: any) => {
      // Sort by price first, then by reliability
      if (a.price !== b.price) return a.price - b.price;
      return b.reliability - a.reliability;
    })
    .slice(0, 5);
  
  // Vendor comparison (average prices per vendor)
  const vendorMap = new Map();
  analytics.pricesByVendor.forEach((item: any) => {
    if (!vendorMap.has(item.vendorId)) {
      vendorMap.set(item.vendorId, {
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        prices: [],
        reliability: item.reliability
      });
    }
    vendorMap.get(item.vendorId).prices.push(item.price);
  });
  
  const vendorComparison = Array.from(vendorMap.values()).map((vendor: any) => ({
    ...vendor,
    avgPrice: vendor.prices.reduce((sum: number, price: number) => sum + price, 0) / vendor.prices.length,
    minPrice: Math.min(...vendor.prices),
    maxPrice: Math.max(...vendor.prices),
    priceCount: vendor.prices.length
  })).sort((a, b) => a.avgPrice - b.avgPrice);
  
  // Generate recommendations
  const recommendations = generateRecommendations(analytics, bestDeals, vendorComparison);
  
  return {
    ...analytics,
    bestDeals,
    vendorComparison,
    recommendations
  };
}

function generateRecommendations(analytics: any, bestDeals: any[], vendorComparison: any[]) {
  const recommendations = [];
  
  if (bestDeals.length > 0) {
    const bestDeal = bestDeals[0];
    recommendations.push({
      type: 'best_price',
      title: 'Best Price Available',
      description: `${bestDeal.vendorName} offers the lowest price at ${bestDeal.price} ${bestDeal.currency}`,
      action: 'Consider this vendor for cost optimization',
      priority: 'high'
    });
  }
  
  if (vendorComparison.length > 1) {
    const priceDifference = vendorComparison[vendorComparison.length - 1].avgPrice - vendorComparison[0].avgPrice;
    const percentageDiff = (priceDifference / vendorComparison[0].avgPrice) * 100;
    
    if (percentageDiff > 20) {
      recommendations.push({
        type: 'price_variance',
        title: 'High Price Variance Detected',
        description: `Price difference of ${percentageDiff.toFixed(1)}% between vendors`,
        action: 'Review vendor selection criteria and negotiate better rates',
        priority: 'medium'
      });
    }
  }
  
  // Check for vendors with consistently good prices and reliability
  const reliableVendors = vendorComparison.filter(v => v.reliability >= 4 && v.avgPrice <= analytics.avgPrice);
  if (reliableVendors.length > 0) {
    recommendations.push({
      type: 'reliable_vendor',
      title: 'Reliable Vendors Available',
      description: `${reliableVendors.length} vendor(s) offer competitive prices with high reliability`,
      action: 'Consider building stronger partnerships with these vendors',
      priority: 'low'
    });
  }
  
  return recommendations;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { action, data } = body;
    
    switch (action) {
      case 'bulk_price_update':
        return await handleBulkPriceUpdate(data);
      case 'price_comparison':
        return await handlePriceComparison(data);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing pricing action:', error);
    return NextResponse.json(
      { error: 'Failed to process pricing action' },
      { status: 500 }
    );
  }
}

async function handleBulkPriceUpdate(data: any) {
  const { productIds, vendorId, priceAdjustment } = data;
  
  const products = await Product.find({ _id: { $in: productIds } });
  
  for (const product of products) {
    const vendorPriceIndex = product.vendorPrices.findIndex(
      (vp: any) => vp.vendor.toString() === vendorId
    );
    
    if (vendorPriceIndex >= 0) {
      const currentPrice = product.vendorPrices[vendorPriceIndex].price;
      let newPrice;
      
      if (priceAdjustment.type === 'percentage') {
        newPrice = currentPrice * (1 + priceAdjustment.value / 100);
      } else {
        newPrice = currentPrice + priceAdjustment.value;
      }
      
      product.vendorPrices[vendorPriceIndex].price = Math.max(0, newPrice);
      product.vendorPrices[vendorPriceIndex].lastUpdated = new Date();
      
      await product.save();
    }
  }
  
  return NextResponse.json({ success: true, updatedProducts: products.length });
}

async function handlePriceComparison(data: any) {
  const { productIds } = data;
  
  const products = await Product.find({ _id: { $in: productIds } })
    .populate('vendorPrices.vendor')
    .select('name brand modelName vendorPrices');
  
  const comparison = products.map(product => {
    const sortedPrices = product.vendorPrices.sort((a: any, b: any) => a.price - b.price);
    const bestPrice = sortedPrices[0];
    const worstPrice = sortedPrices[sortedPrices.length - 1];
    
    return {
      productId: product._id,
      productName: product.name,
      brand: product.brand,
      modelName: product.modelName,
      bestPrice: bestPrice ? {
        vendor: bestPrice.vendor.companyName,
        price: bestPrice.price,
        currency: bestPrice.currency
      } : null,
      worstPrice: worstPrice ? {
        vendor: worstPrice.vendor.companyName,
        price: worstPrice.price,
        currency: worstPrice.currency
      } : null,
      priceRange: bestPrice && worstPrice ? worstPrice.price - bestPrice.price : 0,
      vendorCount: product.vendorPrices.length
    };
  });
  
  return NextResponse.json(comparison);
}
