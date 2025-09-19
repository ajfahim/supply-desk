'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, DollarSign, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';
import { PricingCalculator, VendorComparison, INDUSTRY_MARGINS, DEFAULT_BULK_DISCOUNTS } from '@/lib/pricing';
import PricingAnalyticsDashboard from '@/components/pricing/PricingAnalyticsDashboard';

interface Product {
  _id: string;
  name: string;
  brand: string;
  modelName: string;
  category: { name: string };
  vendorPrices: Array<{
    vendor: { _id: string; companyName: string };
    price: number;
    currency: string;
    deliveryTime: string;
    minimumQuantity: number;
    validUntil: Date;
  }>;
}

interface Settings {
  pricing: {
    defaultProfitMargin: number;
    currency: string;
    roundPrices: boolean;
  };
}

export default function PricingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [customVendorPrice, setCustomVendorPrice] = useState<string>('');
  const [customProfitMargin, setCustomProfitMargin] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [competitorPrices, setCompetitorPrices] = useState<string>('');
  const [vendorComparisons, setVendorComparisons] = useState<VendorComparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, settingsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/settings')
      ]);

      const productsData = await productsRes.json();
      const settingsData = await settingsRes.json();

      setProducts(productsData);
      setSettings(settingsData);
      setCustomProfitMargin(settingsData?.pricing?.defaultProfitMargin?.toString() || '25');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProductData = products.find(p => p._id === selectedProduct);

  const calculatePricing = () => {
    const vendorPrice = parseFloat(customVendorPrice);
    const profitMargin = parseFloat(customProfitMargin);
    
    if (isNaN(vendorPrice) || isNaN(profitMargin)) return null;
    
    return PricingCalculator.calculateSellingPrice(
      vendorPrice,
      profitMargin,
      settings?.pricing?.roundPrices ?? true
    );
  };

  const calculateBulkPricing = () => {
    const vendorPrice = parseFloat(customVendorPrice);
    const profitMargin = parseFloat(customProfitMargin);
    const qty = parseInt(quantity);
    
    if (isNaN(vendorPrice) || isNaN(profitMargin) || isNaN(qty)) return [];
    
    return DEFAULT_BULK_DISCOUNTS.map(discount => ({
      ...discount,
      calculation: PricingCalculator.calculateBulkPricing(
        vendorPrice,
        qty,
        profitMargin,
        [discount]
      )
    }));
  };

  const analyzeCompetitors = () => {
    const vendorPrice = parseFloat(customVendorPrice);
    const profitMargin = parseFloat(customProfitMargin);
    const ourPrice = vendorPrice * (1 + profitMargin / 100);
    
    const competitors = competitorPrices
      .split(',')
      .map(p => parseFloat(p.trim()))
      .filter(p => !isNaN(p));
    
    if (isNaN(vendorPrice) || competitors.length === 0) return null;
    
    return PricingCalculator.analyzeCompetitivePricing(ourPrice, competitors, vendorPrice);
  };

  const compareVendors = () => {
    if (!selectedProductData || !selectedProductData.vendorPrices.length) return;
    
    const profitMargin = parseFloat(customProfitMargin);
    if (isNaN(profitMargin)) return;
    
    // Create a simplified comparison for display
    const comparisons = selectedProductData.vendorPrices.map((vp, index) => {
      const sellingPrice = vp.price * (1 + profitMargin / 100);
      const isLowest = vp.price === Math.min(...selectedProductData.vendorPrices.map(v => v.price));
      const lowestPrice = Math.min(...selectedProductData.vendorPrices.map(v => v.price));
      const savings = isLowest ? 0 : vp.price - lowestPrice;
      
      return {
        vendorId: vp.vendor._id,
        vendorName: vp.vendor.companyName,
        price: vp.price,
        currency: vp.currency,
        sellingPrice: Math.round(sellingPrice),
        deliveryTime: vp.deliveryTime,
        minimumQuantity: vp.minimumQuantity,
        validUntil: vp.validUntil,
        profitMargin,
        isLowest,
        isBestValue: isLowest, // Simplified logic
        savings
      };
    }).sort((a, b) => a.price - b.price);
    
    setVendorComparisons(comparisons);
  };

  useEffect(() => {
    if (selectedProductData) {
      compareVendors();
    }
  }, [selectedProduct, customProfitMargin, selectedProductData]);

  const pricingResult = calculatePricing();
  const bulkPricing = calculateBulkPricing();
  const competitiveAnalysis = analyzeCompetitors();

  const getCategoryMargins = () => {
    const categoryName = selectedProductData?.category?.name || 'Default';
    return INDUSTRY_MARGINS[categoryName as keyof typeof INDUSTRY_MARGINS] || INDUSTRY_MARGINS.Default;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading pricing tools...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Pricing Analysis</h1>
          <p className="text-muted-foreground">
            Calculate profit margins, compare vendors, and analyze competitive pricing
          </p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calculator">Price Calculator</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Comparison</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Pricing</TabsTrigger>
          <TabsTrigger value="competitive">Market Analysis</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Pricing Calculator
                </CardTitle>
                <CardDescription>
                  Calculate selling price with profit margins
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendorPrice">Vendor Price ({settings?.pricing?.currency || 'BDT'})</Label>
                    <Input
                      id="vendorPrice"
                      type="number"
                      placeholder="0.00"
                      value={customVendorPrice}
                      onChange={(e) => setCustomVendorPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profitMargin">Profit Margin (%)</Label>
                    <Input
                      id="profitMargin"
                      type="number"
                      placeholder="25"
                      value={customProfitMargin}
                      onChange={(e) => setCustomProfitMargin(e.target.value)}
                    />
                  </div>
                </div>

                {selectedProductData && (
                  <div>
                    <Label>Industry Standard Margins</Label>
                    <div className="flex gap-2 mt-1">
                      {Object.entries(getCategoryMargins()).map(([key, value]) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomProfitMargin(value.toString())}
                        >
                          {key}: {value}%
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Pricing Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pricingResult ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Vendor Cost:</span>
                      <span className="font-medium">
                        {settings?.pricing?.currency} {pricingResult.vendorPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Amount:</span>
                      <span className="font-medium text-green-600">
                        {settings?.pricing?.currency} {pricingResult.profitAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Selling Price:</span>
                      <span className="text-blue-600">
                        {settings?.pricing?.currency} {pricingResult.sellingPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Markup:</span>
                      <span className="font-medium">
                        {pricingResult.markupPercentage}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Enter vendor price and profit margin to see calculations
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Vendor Price Comparison
              </CardTitle>
              <CardDescription>
                Compare prices from different vendors for the same product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productSelect">Select Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product to compare vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name} - {product.brand} {product.modelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {vendorComparisons.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Vendor Comparison Results</h4>
                  {vendorComparisons.map((comparison, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{comparison.vendorName}</h5>
                            {comparison.isLowest && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Lowest Price
                              </Badge>
                            )}
                            {comparison.isBestValue && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Best Value
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Delivery: {comparison.deliveryTime} | Min Qty: {comparison.minimumQuantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {comparison.currency} {comparison.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Selling: {comparison.currency} {comparison.sellingPrice.toLocaleString()}
                          </div>
                          {comparison.savings && (
                            <div className="text-sm text-red-600">
                              +{comparison.currency} {comparison.savings.toLocaleString()} vs lowest
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Bulk Pricing Calculator
              </CardTitle>
              <CardDescription>
                Calculate pricing with quantity-based discounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              {bulkPricing.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Bulk Discount Tiers</h4>
                  <div className="grid gap-3">
                    {bulkPricing.map((tier, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {tier.minQuantity}+ units: {tier.discountPercent}% discount
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Discounted cost: {settings?.pricing?.currency} {tier.calculation.vendorPrice.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {settings?.pricing?.currency} {tier.calculation.sellingPrice.toLocaleString()}
                            </div>
                            <div className="text-sm text-green-600">
                              Profit: {settings?.pricing?.currency} {tier.calculation.profitAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Competitive Analysis
              </CardTitle>
              <CardDescription>
                Analyze your pricing against competitors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="competitorPrices">Competitor Prices (comma-separated)</Label>
                <Input
                  id="competitorPrices"
                  placeholder="1500, 1600, 1450, 1700"
                  value={competitorPrices}
                  onChange={(e) => setCompetitorPrices(e.target.value)}
                />
              </div>

              {competitiveAnalysis && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">Market Position:</h4>
                    <Badge 
                      variant={
                        competitiveAnalysis.position === 'lowest' ? 'default' :
                        competitiveAnalysis.position === 'competitive' ? 'secondary' : 'destructive'
                      }
                    >
                      {competitiveAnalysis.position.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Price Advantage</div>
                      <div className={`text-lg font-semibold ${
                        competitiveAnalysis.priceAdvantage > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {competitiveAnalysis.priceAdvantage > 0 ? '+' : ''}{competitiveAnalysis.priceAdvantage}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Margin Impact</div>
                      <div className={`text-lg font-semibold ${
                        competitiveAnalysis.marginImpact > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {competitiveAnalysis.marginImpact > 0 ? '+' : ''}{competitiveAnalysis.marginImpact}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Recommendations:</h5>
                    <ul className="space-y-1">
                      {competitiveAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PricingAnalyticsDashboard 
            productId={selectedProduct || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
