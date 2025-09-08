import { IVendorPrice } from './models/Product';

export interface PricingCalculation {
  vendorPrice: number;
  profitMargin: number;
  profitAmount: number;
  sellingPrice: number;
  markupPercentage: number;
  currency: string;
}

export interface VendorComparison {
  vendorId: string;
  vendorName: string;
  price: number;
  currency: string;
  deliveryTime: string;
  minimumQuantity: number;
  validUntil: Date;
  profitMargin: number;
  sellingPrice: number;
  savings?: number;
  isLowest: boolean;
  isBestValue: boolean;
}

export class PricingCalculator {
  /**
   * Calculate selling price with profit margin
   */
  static calculateSellingPrice(
    vendorPrice: number,
    profitMarginPercent: number,
    roundPrices: boolean = true
  ): PricingCalculation {
    const profitAmount = (vendorPrice * profitMarginPercent) / 100;
    const sellingPrice = vendorPrice + profitAmount;
    const markupPercentage = (profitAmount / vendorPrice) * 100;

    return {
      vendorPrice,
      profitMargin: profitMarginPercent,
      profitAmount: roundPrices ? Math.round(profitAmount * 100) / 100 : profitAmount,
      sellingPrice: roundPrices ? Math.round(sellingPrice * 100) / 100 : sellingPrice,
      markupPercentage: Math.round(markupPercentage * 100) / 100,
      currency: 'BDT'
    };
  }

  /**
   * Calculate profit margin from selling price and vendor cost
   */
  static calculateProfitMargin(vendorPrice: number, sellingPrice: number): number {
    if (vendorPrice <= 0) return 0;
    const profitAmount = sellingPrice - vendorPrice;
    return Math.round(((profitAmount / vendorPrice) * 100) * 100) / 100;
  }

  /**
   * Calculate break-even price with minimum margin
   */
  static calculateBreakEven(vendorPrice: number, minimumMargin: number): number {
    return vendorPrice * (1 + minimumMargin / 100);
  }

  /**
   * Compare vendor prices and calculate best options
   */
  static compareVendorPrices(
    vendorPrices: (IVendorPrice & { vendorName: string })[],
    profitMargin: number,
    roundPrices: boolean = true
  ): VendorComparison[] {
    if (!vendorPrices || vendorPrices.length === 0) return [];

    const comparisons = vendorPrices.map(vp => {
      const calculation = this.calculateSellingPrice(vp.price, profitMargin, roundPrices);
      
      return {
        vendorId: vp.vendor.toString(),
        vendorName: vp.vendorName,
        price: vp.price,
        currency: vp.currency,
        deliveryTime: vp.deliveryTime,
        minimumQuantity: vp.minimumQuantity,
        validUntil: vp.validUntil,
        profitMargin,
        sellingPrice: calculation.sellingPrice,
        savings: undefined as number | undefined,
        isLowest: false,
        isBestValue: false
      };
    });

    // Find lowest price
    const lowestPrice = Math.min(...comparisons.map(c => c.price));
    const lowestPriceComparison = comparisons.find(c => c.price === lowestPrice);
    if (lowestPriceComparison) {
      lowestPriceComparison.isLowest = true;
    }

    // Calculate savings compared to lowest price
    comparisons.forEach(comp => {
      if (comp.price > lowestPrice) {
        comp.savings = comp.price - lowestPrice;
      }
    });

    // Determine best value (considering price, delivery time, and minimum quantity)
    const bestValue = comparisons.reduce((best, current) => {
      // Score based on price (lower is better), delivery time, and minimum quantity
      const currentScore = this.calculateValueScore(current);
      const bestScore = this.calculateValueScore(best);
      
      return currentScore > bestScore ? current : best;
    });
    
    bestValue.isBestValue = true;

    // Sort by price (lowest first)
    return comparisons.sort((a, b) => a.price - b.price);
  }

  /**
   * Calculate value score for vendor comparison
   */
  private static calculateValueScore(comparison: VendorComparison): number {
    let score = 0;
    
    // Price score (inverse - lower price = higher score)
    score += (1 / comparison.price) * 1000000; // Normalize for scoring
    
    // Delivery time score (shorter delivery = higher score)
    const deliveryDays = this.parseDeliveryDays(comparison.deliveryTime);
    if (deliveryDays > 0) {
      score += (1 / deliveryDays) * 100;
    }
    
    // Minimum quantity score (lower minimum = higher score)
    score += (1 / comparison.minimumQuantity) * 10;
    
    return score;
  }

  /**
   * Parse delivery time string to extract days
   */
  private static parseDeliveryDays(deliveryTime: string): number {
    if (!deliveryTime) return 30; // Default to 30 days if not specified
    
    const match = deliveryTime.match(/(\d+)[-\s]*(\d+)?\s*days?/i);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return (min + max) / 2; // Average if range
    }
    
    // Try to extract just numbers
    const numMatch = deliveryTime.match(/(\d+)/);
    if (numMatch) {
      return parseInt(numMatch[1]);
    }
    
    return 30; // Default
  }

  /**
   * Calculate bulk pricing tiers
   */
  static calculateBulkPricing(
    basePrice: number,
    quantity: number,
    profitMargin: number,
    bulkDiscounts: { minQuantity: number; discountPercent: number }[] = []
  ): PricingCalculation {
    let discountPercent = 0;
    
    // Find applicable bulk discount
    const applicableDiscount = bulkDiscounts
      .filter(d => quantity >= d.minQuantity)
      .sort((a, b) => b.discountPercent - a.discountPercent)[0];
    
    if (applicableDiscount) {
      discountPercent = applicableDiscount.discountPercent;
    }
    
    const discountedPrice = basePrice * (1 - discountPercent / 100);
    return this.calculateSellingPrice(discountedPrice, profitMargin);
  }

  /**
   * Calculate competitive pricing analysis
   */
  static analyzeCompetitivePricing(
    ourPrice: number,
    competitorPrices: number[],
    vendorCost: number
  ): {
    position: 'lowest' | 'competitive' | 'premium';
    priceAdvantage: number;
    marginImpact: number;
    recommendations: string[];
  } {
    if (competitorPrices.length === 0) {
      return {
        position: 'competitive',
        priceAdvantage: 0,
        marginImpact: 0,
        recommendations: ['No competitor data available for analysis']
      };
    }

    const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const lowestCompetitorPrice = Math.min(...competitorPrices);
    const highestCompetitorPrice = Math.max(...competitorPrices);
    
    let position: 'lowest' | 'competitive' | 'premium';
    let recommendations: string[] = [];
    
    if (ourPrice <= lowestCompetitorPrice) {
      position = 'lowest';
      recommendations.push('You have the lowest price in the market');
      recommendations.push('Consider if you can increase margin while staying competitive');
    } else if (ourPrice <= avgCompetitorPrice) {
      position = 'competitive';
      recommendations.push('Your pricing is competitive with market average');
    } else {
      position = 'premium';
      recommendations.push('Your price is above market average');
      recommendations.push('Justify premium with superior service or quality');
    }
    
    const priceAdvantage = ((avgCompetitorPrice - ourPrice) / avgCompetitorPrice) * 100;
    const currentMargin = this.calculateProfitMargin(vendorCost, ourPrice);
    const marginAtCompetitorAvg = this.calculateProfitMargin(vendorCost, avgCompetitorPrice);
    const marginImpact = marginAtCompetitorAvg - currentMargin;
    
    return {
      position,
      priceAdvantage: Math.round(priceAdvantage * 100) / 100,
      marginImpact: Math.round(marginImpact * 100) / 100,
      recommendations
    };
  }
}

/**
 * Default bulk discount tiers
 */
export const DEFAULT_BULK_DISCOUNTS = [
  { minQuantity: 10, discountPercent: 2 },
  { minQuantity: 25, discountPercent: 5 },
  { minQuantity: 50, discountPercent: 8 },
  { minQuantity: 100, discountPercent: 12 },
  { minQuantity: 500, discountPercent: 15 }
];

/**
 * Industry standard profit margins by category
 */
export const INDUSTRY_MARGINS = {
  'Industrial Valves': { min: 15, standard: 25, premium: 35 },
  'Sensors': { min: 20, standard: 30, premium: 45 },
  'Hydraulic Equipment': { min: 18, standard: 28, premium: 40 },
  'Electrical Components': { min: 22, standard: 32, premium: 50 },
  'Default': { min: 15, standard: 25, premium: 35 }
};
