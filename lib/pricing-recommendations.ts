interface VendorPrice {
  vendor: {
    _id: string;
    companyName: string;
    reliability: number;
    deliveryTime: string;
    paymentTerms: string;
  };
  price: number;
  currency: string;
  validUntil: Date;
  minimumQuantity: number;
  deliveryTime: string;
  lastUpdated: Date;
}

interface PriceRecommendation {
  type: 'best_price' | 'best_value' | 'fastest_delivery' | 'most_reliable';
  vendorPrice: VendorPrice;
  score: number;
  reason: string;
  savings?: number;
  savingsPercentage?: number;
}

export class PricingRecommendationEngine {
  static analyzeVendorPrices(vendorPrices: VendorPrice[]): {
    recommendations: PriceRecommendation[];
    summary: {
      lowestPrice: number;
      highestPrice: number;
      averagePrice: number;
      priceRange: number;
      totalVendors: number;
    };
  } {
    if (!vendorPrices || vendorPrices.length === 0) {
      return {
        recommendations: [],
        summary: {
          lowestPrice: 0,
          highestPrice: 0,
          averagePrice: 0,
          priceRange: 0,
          totalVendors: 0,
        },
      };
    }

    // Filter out expired prices
    const validPrices = vendorPrices.filter(vp => 
      new Date(vp.validUntil) > new Date()
    );

    if (validPrices.length === 0) {
      return {
        recommendations: [],
        summary: {
          lowestPrice: 0,
          highestPrice: 0,
          averagePrice: 0,
          priceRange: 0,
          totalVendors: 0,
        },
      };
    }

    // Calculate summary statistics
    const prices = validPrices.map(vp => vp.price);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const priceRange = highestPrice - lowestPrice;

    const summary = {
      lowestPrice,
      highestPrice,
      averagePrice,
      priceRange,
      totalVendors: validPrices.length,
    };

    // Generate recommendations
    const recommendations: PriceRecommendation[] = [];

    // Best Price Recommendation
    const bestPriceVendor = validPrices.find(vp => vp.price === lowestPrice);
    if (bestPriceVendor) {
      const savings = highestPrice - lowestPrice;
      const savingsPercentage = ((savings / highestPrice) * 100);
      
      recommendations.push({
        type: 'best_price',
        vendorPrice: bestPriceVendor,
        score: 100,
        reason: `Lowest price available. Save ${savings.toFixed(2)} ${bestPriceVendor.currency} (${savingsPercentage.toFixed(1)}%) compared to highest price.`,
        savings,
        savingsPercentage,
      });
    }

    // Best Value Recommendation (price + reliability)
    const valueScores = validPrices.map(vp => {
      const priceScore = ((highestPrice - vp.price) / priceRange) * 60; // 60% weight for price
      const reliabilityScore = ((vp.vendor.reliability || 3) / 5) * 40; // 40% weight for reliability
      return {
        vendorPrice: vp,
        score: priceScore + reliabilityScore,
      };
    });

    const bestValue = valueScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    if (bestValue && bestValue.vendorPrice !== bestPriceVendor) {
      const priceDiff = bestValue.vendorPrice.price - lowestPrice;
      recommendations.push({
        type: 'best_value',
        vendorPrice: bestValue.vendorPrice,
        score: bestValue.score,
        reason: `Best balance of price and reliability (${bestValue.vendorPrice.vendor.reliability}/5 stars). Only ${priceDiff.toFixed(2)} ${bestValue.vendorPrice.currency} more than lowest price.`,
      });
    }

    // Fastest Delivery Recommendation
    const deliveryTimes = validPrices
      .filter(vp => vp.deliveryTime || vp.vendor.deliveryTime)
      .map(vp => ({
        vendorPrice: vp,
        deliveryTime: vp.deliveryTime || vp.vendor.deliveryTime,
      }));

    if (deliveryTimes.length > 0) {
      // Simple heuristic: shorter delivery time strings are usually faster
      const fastestDelivery = deliveryTimes.reduce((fastest, current) => 
        (current.deliveryTime?.length || 0) < (fastest.deliveryTime?.length || 0) ? current : fastest
      );

      if (fastestDelivery && !recommendations.find(r => r.vendorPrice === fastestDelivery.vendorPrice)) {
        recommendations.push({
          type: 'fastest_delivery',
          vendorPrice: fastestDelivery.vendorPrice,
          score: 85,
          reason: `Fastest delivery time: ${fastestDelivery.deliveryTime}`,
        });
      }
    }

    // Most Reliable Vendor Recommendation
    const mostReliable = validPrices.reduce((best, current) => 
      (current.vendor.reliability || 0) > (best.vendor.reliability || 0) ? current : best
    );

    if (mostReliable && mostReliable.vendor.reliability >= 4 && 
        !recommendations.find(r => r.vendorPrice === mostReliable)) {
      recommendations.push({
        type: 'most_reliable',
        vendorPrice: mostReliable,
        score: 90,
        reason: `Highest reliability rating: ${mostReliable.vendor.reliability}/5 stars`,
      });
    }

    // Sort recommendations by score
    recommendations.sort((a, b) => b.score - a.score);

    return { recommendations, summary };
  }

  static getBestPriceForQuantity(vendorPrices: VendorPrice[], quantity: number): VendorPrice | null {
    const validPrices = vendorPrices.filter(vp => 
      new Date(vp.validUntil) > new Date() && 
      vp.minimumQuantity <= quantity
    );

    if (validPrices.length === 0) return null;

    return validPrices.reduce((best, current) => 
      current.price < best.price ? current : best
    );
  }

  static calculatePotentialSavings(
    currentVendorPrice: VendorPrice,
    allVendorPrices: VendorPrice[],
    quantity: number = 1
  ): {
    bestAlternative: VendorPrice | null;
    potentialSavings: number;
    savingsPercentage: number;
  } {
    const bestPrice = this.getBestPriceForQuantity(allVendorPrices, quantity);
    
    if (!bestPrice || bestPrice === currentVendorPrice) {
      return {
        bestAlternative: null,
        potentialSavings: 0,
        savingsPercentage: 0,
      };
    }

    const potentialSavings = (currentVendorPrice.price - bestPrice.price) * quantity;
    const savingsPercentage = (potentialSavings / (currentVendorPrice.price * quantity)) * 100;

    return {
      bestAlternative: bestPrice,
      potentialSavings,
      savingsPercentage,
    };
  }

  static generateQuotationOptimizationSuggestions(
    quotationItems: Array<{
      product: string;
      productName: string;
      quantity: number;
      selectedVendor: string;
      vendorCost: number;
      vendorPrices?: VendorPrice[];
    }>
  ): Array<{
    itemIndex: number;
    productName: string;
    currentCost: number;
    recommendedVendor: VendorPrice;
    potentialSavings: number;
    savingsPercentage: number;
  }> {
    const suggestions: Array<{
      itemIndex: number;
      productName: string;
      currentCost: number;
      recommendedVendor: VendorPrice;
      potentialSavings: number;
      savingsPercentage: number;
    }> = [];

    quotationItems.forEach((item, index) => {
      if (!item.vendorPrices || item.vendorPrices.length <= 1) return;

      const currentVendor = item.vendorPrices.find(vp => 
        vp.vendor._id === item.selectedVendor
      );

      if (!currentVendor) return;

      const bestPrice = this.getBestPriceForQuantity(item.vendorPrices, item.quantity);
      
      if (bestPrice && bestPrice !== currentVendor && bestPrice.price < currentVendor.price) {
        const potentialSavings = (currentVendor.price - bestPrice.price) * item.quantity;
        const savingsPercentage = (potentialSavings / (currentVendor.price * item.quantity)) * 100;

        suggestions.push({
          itemIndex: index,
          productName: item.productName,
          currentCost: currentVendor.price * item.quantity,
          recommendedVendor: bestPrice,
          potentialSavings,
          savingsPercentage,
        });
      }
    });

    return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }
}
