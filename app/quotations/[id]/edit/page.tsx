'use client';

import VendorPriceComparison from "@/components/pricing/VendorPriceComparison";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PricingCalculator } from "@/lib/pricing";
import { PricingRecommendationEngine } from "@/lib/pricing-recommendations";
import {
  AlertTriangle,
  Award,
  Calculator,
  DollarSign,
  Lightbulb,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Save,
  ArrowLeft,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Client {
  _id: string;
  companyName: string;
  contacts: Array<{
    _id: string;
    name: string;
    title: string;
    email: string;
    isPrimary: boolean;
  }>;
}

interface Product {
  _id: string;
  name: string;
  brand: string;
  modelName: string;
  unit: string;
  specifications?: {
    [key: string]: any;
  };
  vendorPrices: Array<{
    vendor: {
      _id: string;
      companyName: string;
      reliability?: number;
      deliveryTime?: string;
      paymentTerms?: string;
    };
    price: number;
    currency: string;
    validUntil?: string;
    minimumQuantity?: number;
    deliveryTime: string;
    lastUpdated?: string;
  }>;
}

interface QuotationItem {
  product: string;
  productName: string;
  brand: string;
  modelName: string;
  specifications?: {
    [key: string]: any;
  };
  quantity: number;
  unit: string;
  unitPrice?: number;
  selectedVendor: string;
  vendorName: string;
  vendorCost: number;
  vendorCurrency: string;
  profitMargin: number;
  sellingPrice: number;
  lineTotal: number;
  deliveryTime?: string;
  warranty?: string;
  notes?: string;
}

interface Quotation {
  _id: string;
  quotationNumber: string;
  client: {
    _id: string;
    companyName: string;
    contacts: any[];
  };
  clientContact: {
    _id: string;
    name: string;
    email: string;
    title: string;
    phone: string;
  };
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxRate: number;
  validUntil: string;
  paymentTerms: string;
  deliveryTerms: string;
  warranty: string;
  notes: string;
  status: string;
}

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [validUntil, setValidUntil] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [warranty, setWarranty] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [taxRate, setTaxRate] = useState(0);
  const [transportationCost, setTransportationCost] = useState(0);
  const [termsAndInstructions, setTermsAndInstructions] = useState('');

  // Dialog states
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductForPricing, setSelectedProductForPricing] = useState<Product | null>(null);
  const [selectedProductForComparison, setSelectedProductForComparison] = useState<Product | null>(null);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  const [vendorPrice, setVendorPrice] = useState('');
  const [profitMargin, setProfitMargin] = useState('25');
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<any[]>([]);

  useEffect(() => {
    fetchQuotationAndClients();
  }, [quotationId]);

  const fetchQuotationAndClients = async () => {
    try {
      const [quotationRes, clientsRes, productsRes, settingsRes] = await Promise.all([
        fetch(`/api/quotations/${quotationId}`),
        fetch('/api/clients'),
        fetch('/api/products'),
        fetch('/api/settings')
      ]);

      const quotationData = await quotationRes.json();
      const clientsData = await clientsRes.json();
      const productsData = await productsRes.json();
      const settingsData = await settingsRes.json();

      setQuotation(quotationData);
      setClients(clientsData || []);
      setProducts(productsData || []);
      setSettings(settingsData);

      // Pre-populate form
      setSelectedClient(quotationData.client._id);
      setSelectedContact(quotationData.clientContact._id);
      
      // Transform items to match the expected structure
      const transformedItems = quotationData.items.map((item: any) => ({
        product: item.product?._id || item.product,
        productName: item.productName || item.product?.name || '',
        brand: item.brand || item.product?.brand || '',
        modelName: item.modelName || item.product?.modelName || '',
        specifications: item.specifications || {},
        quantity: item.quantity || 1,
        unit: item.unit || 'pcs',
        selectedVendor: item.selectedVendor?._id || item.selectedVendor || '',
        vendorName: item.selectedVendor?.companyName || item.vendorName || '',
        vendorCost: item.vendorCost || 0,
        vendorCurrency: item.vendorCurrency || 'BDT',
        profitMargin: item.profitMargin || 25,
        sellingPrice: item.sellingPrice || item.unitPrice || 0,
        lineTotal: item.lineTotal || 0,
        deliveryTime: item.deliveryTime || '',
        warranty: item.warranty || '',
        notes: item.notes || ''
      }));
      
      setItems(transformedItems);
      
      // Format date for input field
      const validUntilDate = quotationData.validUntil ? new Date(quotationData.validUntil).toISOString().split('T')[0] : '';
      setValidUntil(validUntilDate);
      
      setDeliveryTerms(quotationData.deliveryTerms || '');
      setPaymentTerms(quotationData.paymentTerms || '');
      setWarranty(quotationData.warranty || '');
      setNotes(quotationData.notes || '');
      setDiscount(quotationData.discount || 0);
      setDiscountType(quotationData.discountType || 'percentage');
      setTaxRate(quotationData.taxRate || 0);
      setTransportationCost(quotationData.transportationCost || 0);
      setTermsAndInstructions(quotationData.termsAndInstructions || '');

      if (settingsData?.pricing?.defaultProfitMargin) {
        setProfitMargin(settingsData.pricing.defaultProfitMargin.toString());
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (items.length > 0 && products.length > 0) {
      const suggestions = items
        .map((item, index) => {
          const product = products.find((p) => p._id === item.product);
          if (!product || product.vendorPrices.length === 0) return null;

          const currentVendorPrice = product.vendorPrices.find(
            (vp) => vp.vendor._id === item.selectedVendor
          );
          if (!currentVendorPrice) return null;

          // For now, skip optimization suggestions due to API compatibility
          const recommendations: any[] = [];

          return recommendations.length > 0
            ? {
                itemIndex: index,
                productName: item.productName,
                currentVendor: item.vendorName,
                currentPrice: item.vendorCost,
                recommendations,
                recommendedVendor: recommendations[0],
                potentialSavings: currentVendorPrice.price - recommendations[0].price,
              }
            : null;
        })
        .filter(Boolean)
        .map((suggestion) => ({
          ...suggestion,
          vendorPrices:
            products
              .find((p) => p._id === items[suggestion!.itemIndex].product)
              ?.vendorPrices.map((vp) => ({
                vendor: {
                  _id: vp.vendor._id,
                  companyName: vp.vendor.companyName,
                  reliability: vp.vendor.reliability || 3,
                  deliveryTime: vp.vendor.deliveryTime || "",
                  paymentTerms: vp.vendor.paymentTerms || "",
                },
                price: vp.price,
                currency: vp.currency,
                validUntil: vp.validUntil ? new Date(vp.validUntil) : new Date(),
                minimumQuantity: vp.minimumQuantity || 1,
                deliveryTime: vp.deliveryTime,
                lastUpdated: vp.lastUpdated
                  ? new Date(vp.lastUpdated)
                  : new Date(),
              })) || [],
        }));
      setOptimizationSuggestions(suggestions);
    } else {
      setOptimizationSuggestions([]);
    }
  }, [items, products]);

  const applyOptimizationSuggestion = (suggestion: any) => {
    const updatedItems = [...items];
    const item = updatedItems[suggestion.itemIndex];

    item.selectedVendor = suggestion.recommendedVendor.vendor._id;
    item.vendorName = suggestion.recommendedVendor.vendor.companyName;
    item.vendorCost = suggestion.recommendedVendor.price;
    item.vendorCurrency = suggestion.recommendedVendor.currency;
    item.deliveryTime = suggestion.recommendedVendor.deliveryTime;

    // Recalculate prices
    const marginMultiplier = 1 + item.profitMargin / 100;
    item.sellingPrice = item.vendorCost * marginMultiplier;
    item.lineTotal = item.sellingPrice * item.quantity;

    setItems(updatedItems);
  };

  const openPricingCalculator = (product: Product) => {
    setSelectedProductForPricing(product);
    if (product.vendorPrices.length > 0) {
      setVendorPrice(product.vendorPrices[0].price.toString());
    }
    setPricingDialogOpen(true);
  };

  const openPriceComparison = (product: Product) => {
    setSelectedProductForComparison(product);
    setShowPriceComparison(true);
  };

  const convertProductForComparison = (product: Product) => {
    return {
      ...product,
      vendorPrices: product.vendorPrices.map((vp) => ({
        vendor: {
          _id: vp.vendor._id,
          companyName: vp.vendor.companyName,
          reliability: vp.vendor.reliability || 3,
          deliveryTime: vp.vendor.deliveryTime || "",
          paymentTerms: vp.vendor.paymentTerms || "",
        },
        price: vp.price,
        currency: vp.currency,
        validUntil: vp.validUntil ? new Date(vp.validUntil) : new Date(),
        minimumQuantity: vp.minimumQuantity || 1,
        deliveryTime: vp.deliveryTime,
        lastUpdated: vp.lastUpdated ? new Date(vp.lastUpdated) : new Date(),
      })),
    };
  };

  const handleVendorPriceSelect = (vendorPrice: any) => {
    if (!selectedProductForComparison) return;

    const newItem: QuotationItem = {
      product: selectedProductForComparison._id,
      productName: selectedProductForComparison.name,
      brand: selectedProductForComparison.brand,
      modelName: selectedProductForComparison.modelName,
      quantity: 1,
      unit: selectedProductForComparison.unit,
      selectedVendor: vendorPrice.vendor._id,
      vendorName: vendorPrice.vendor.companyName,
      vendorCost: vendorPrice.price,
      vendorCurrency: vendorPrice.currency,
      profitMargin: settings?.pricing?.defaultProfitMargin || 15,
      sellingPrice: vendorPrice.price * (1 + (settings?.pricing?.defaultProfitMargin || 15) / 100),
      lineTotal: vendorPrice.price * (1 + (settings?.pricing?.defaultProfitMargin || 15) / 100),
      deliveryTime: vendorPrice.deliveryTime,
      warranty: "",
      notes: "",
    };

    setItems([...items, newItem]);
    setShowPriceComparison(false);
    setSelectedProductForComparison(null);
  };

  const calculatePricing = () => {
    const price = parseFloat(vendorPrice);
    const margin = parseFloat(profitMargin);

    if (isNaN(price) || isNaN(margin)) return null;

    return PricingCalculator.calculateSellingPrice(
      price,
      margin,
      settings?.pricing?.roundPrices ?? true
    );
  };

  const addProductWithCalculatedPrice = () => {
    if (!selectedProductForPricing) return;

    const pricing = calculatePricing();
    if (!pricing) return;

    const newItem: QuotationItem = {
      product: selectedProductForPricing._id,
      productName: selectedProductForPricing.name,
      brand: selectedProductForPricing.brand,
      modelName: selectedProductForPricing.modelName,
      specifications: selectedProductForPricing.specifications,
      quantity: 1,
      unit: selectedProductForPricing.unit,
      selectedVendor: "",
      vendorName: "",
      vendorCost: pricing.vendorPrice,
      vendorCurrency: "BDT",
      profitMargin: parseFloat(profitMargin),
      sellingPrice: pricing.sellingPrice,
      lineTotal: pricing.sellingPrice,
      deliveryTime: "",
      warranty: "",
      notes: "",
    };

    setItems([...items, newItem]);
    setPricingDialogOpen(false);
    setVendorPrice("");
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate prices when quantity or margin changes
    if (field === 'quantity' || field === 'profitMargin' || field === 'vendorCost') {
      const item = updatedItems[index];
      const marginMultiplier = 1 + item.profitMargin / 100;
      item.sellingPrice = item.vendorCost * marginMultiplier;
      item.lineTotal = item.sellingPrice * item.quantity;
    }

    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }

    const afterDiscount = subtotal - discountAmount;
    // Tax should only be calculated on product prices, not transportation cost
    const taxAmount = (afterDiscount * taxRate) / 100;
    const grandTotal = afterDiscount + transportationCost + taxAmount;

    return {
      subtotal,
      discountAmount,
      transportationCost,
      taxAmount,
      grandTotal,
    };
  };

  const handleSave = async () => {
    if (!selectedClient || !selectedContact || items.length === 0) {
      alert('Please fill in all required fields and add at least one item.');
      return;
    }

    setSaving(true);

    try {
      const { subtotal, discountAmount, taxAmount, grandTotal } = calculateTotals();

      const quotationData = {
        client: selectedClient,
        clientContact: selectedContact,
        items,
        subtotal,
        discount,
        discountType,
        transportationCost,
        taxRate,
        taxAmount,
        grandTotal,
        validUntil,
        deliveryTerms,
        paymentTerms,
        warranty,
        termsAndInstructions,
        notes,
      };

      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });

      if (response.ok) {
        router.push(`/quotations/${quotationId}`);
      } else {
        throw new Error('Failed to update quotation');
      }
    } catch (error) {
      console.error('Error updating quotation:', error);
      alert('Failed to update quotation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, discountAmount, taxAmount, grandTotal } = calculateTotals();
  const selectedClientData = clients?.find(c => c._id === selectedClient);

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.modelName?.toLowerCase().includes(productSearchTerm.toLowerCase())
  ) || [];

  // Group products and show only unique products with lowest price vendor
  const uniqueProductsWithBestPrice = filteredProducts.reduce(
    (acc, product) => {
      const existingProduct = acc.find(
        (p) =>
          p.name === product.name &&
          p.brand === product.brand &&
          p.modelName === product.modelName
      );

      if (!existingProduct) {
        // Find the lowest price vendor for this product
        const lowestPriceVendor =
          product.vendorPrices.length > 0
            ? product.vendorPrices.reduce((lowest, current) =>
                current.price < lowest.price ? current : lowest
              )
            : null;

        acc.push({
          ...product,
          lowestPriceVendor,
        });
      }
      return acc;
    },
    [] as (Product & { lowestPriceVendor: any })[]
  );

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading quotation...</div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Quotation not found</h1>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Quotation</h1>
          <p className="text-gray-600 mt-1">
            Editing quotation #{quotation.quotationNumber}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !selectedClient || !selectedContact || items.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client">Client Company</Label>
                <Select
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClientData && (
                <div>
                  <Label htmlFor="contact">Contact Person</Label>
                  <Select
                    value={selectedContact}
                    onValueChange={setSelectedContact}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedClientData.contacts.map((contact) => (
                        <SelectItem key={contact._id} value={contact._id}>
                          {contact.name} - {contact.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quotation Items</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="min-w-[50vw] overflow-auto overflow-x-hidden">
                  <DialogHeader>
                    <DialogTitle>Select Product</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col h-full space-y-4">
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Search className="w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search products..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-h-[50vh] border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[25%]">Product</TableHead>
                            <TableHead className="w-[20%]">
                              Brand/Model
                            </TableHead>
                            <TableHead className="w-[20%]">Vendor</TableHead>
                            <TableHead className="w-[15%]">Price</TableHead>
                            <TableHead className="w-[20%]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uniqueProductsWithBestPrice.length > 0 ? (
                            uniqueProductsWithBestPrice.map((product) => (
                              <TableRow key={product._id}>
                                <TableCell className="w-[25%]">
                                  <div
                                    className="font-medium truncate"
                                    title={product.name}
                                  >
                                    {product.name}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[20%]">
                                  <div
                                    className="truncate"
                                    title={`${product.brand} ${product.modelName}`}
                                  >
                                    {product.brand} {product.modelName}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[20%]">
                                  <div className="flex flex-col">
                                    <div
                                      className="truncate font-medium"
                                      title={
                                        product.lowestPriceVendor?.vendor
                                          .companyName
                                      }
                                    >
                                      {product.lowestPriceVendor?.vendor
                                        .companyName || "No vendor"}
                                    </div>
                                    {product.vendorPrices.length > 1 && (
                                      <div className="text-xs text-gray-500">
                                        +{product.vendorPrices.length - 1} more
                                        vendor
                                        {product.vendorPrices.length > 2
                                          ? "s"
                                          : ""}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[15%]">
                                  <div className="flex flex-col">
                                    <div className="font-medium text-green-600">
                                      {product.lowestPriceVendor?.price.toLocaleString() ||
                                        "N/A"}{" "}
                                      {product.lowestPriceVendor?.currency ||
                                        ""}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Lowest price
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="w-[20%]">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        if (product.lowestPriceVendor) {
                                          const vendorPrice = product.lowestPriceVendor;
                                          const newItem: QuotationItem = {
                                            product: product._id,
                                            productName: product.name,
                                            brand: product.brand,
                                            modelName: product.modelName,
                                            quantity: 1,
                                            unit: product.unit,
                                            selectedVendor: vendorPrice.vendor._id,
                                            vendorName: vendorPrice.vendor.companyName,
                                            vendorCost: vendorPrice.price,
                                            vendorCurrency: vendorPrice.currency,
                                            profitMargin: settings?.pricing?.defaultProfitMargin || 15,
                                            sellingPrice: vendorPrice.price * (1 + (settings?.pricing?.defaultProfitMargin || 15) / 100),
                                            lineTotal: vendorPrice.price * (1 + (settings?.pricing?.defaultProfitMargin || 15) / 100),
                                            deliveryTime: vendorPrice.deliveryTime,
                                            warranty: "",
                                            notes: "",
                                          };
                                          setItems([...items, newItem]);
                                        }
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700"
                                      disabled={!product.lowestPriceVendor}
                                    >
                                      Add Best
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        openPriceComparison(product)
                                      }
                                      className="flex items-center gap-1"
                                      title="Compare all vendor prices"
                                    >
                                      <Award className="h-3 w-3" />
                                      Compare
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8 text-gray-500"
                              >
                                {productSearchTerm
                                  ? "No products found matching your search."
                                  : "No products available."}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Pricing Calculator Dialog */}
              <Dialog
                open={pricingDialogOpen}
                onOpenChange={setPricingDialogOpen}
              >
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Pricing Calculator
                    </DialogTitle>
                  </DialogHeader>
                  {selectedProductForPricing && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <h4 className="font-medium">
                          {selectedProductForPricing.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {selectedProductForPricing.brand}{" "}
                          {selectedProductForPricing.modelName}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="vendorPrice">
                            Vendor Price ({settings?.pricing?.currency || "BDT"}
                            )
                          </Label>
                          <Input
                            id="vendorPrice"
                            type="number"
                            placeholder="0.00"
                            value={vendorPrice}
                            onChange={(e) => setVendorPrice(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="profitMargin">
                            Profit Margin (%)
                          </Label>
                          <Input
                            id="profitMargin"
                            type="number"
                            placeholder="25"
                            value={profitMargin}
                            onChange={(e) => setProfitMargin(e.target.value)}
                          />
                        </div>
                      </div>

                      {selectedProductForPricing.vendorPrices.length > 0 && (
                        <div>
                          <Label>Available Vendor Prices</Label>
                          <div className="grid gap-2 mt-1">
                            {selectedProductForPricing.vendorPrices.map(
                              (vp, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setVendorPrice(vp.price.toString())
                                  }
                                  className="justify-start"
                                >
                                  {vp.vendor.companyName}:{" "}
                                  {vp.price.toLocaleString()} {vp.currency}
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {calculatePricing() && (
                        <div className="bg-blue-50 p-4 rounded-md">
                          <h5 className="font-medium mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Pricing Results
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Vendor Cost:</span>
                              <span className="font-medium">
                                {settings?.pricing?.currency}{" "}
                                {calculatePricing()!.vendorPrice.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Profit Amount:</span>
                              <span className="font-medium text-green-600">
                                {settings?.pricing?.currency}{" "}
                                {calculatePricing()!.profitAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-base font-semibold">
                              <span>Selling Price:</span>
                              <span className="text-blue-600">
                                {settings?.pricing?.currency}{" "}
                                {calculatePricing()!.sellingPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setPricingDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={addProductWithCalculatedPrice}
                          disabled={!vendorPrice || !profitMargin}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Add with Calculated Price
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Vendor Price Comparison Dialog */}
              <Dialog
                open={showPriceComparison}
                onOpenChange={setShowPriceComparison}
              >
                <DialogContent className="min-w-[50vw] max-h-[95vh] w-full h-full">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Vendor Price Comparison
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden">
                    {selectedProductForComparison && (
                      <VendorPriceComparison
                        product={convertProductForComparison(
                          selectedProductForComparison
                        )}
                        onPriceSelect={handleVendorPriceSelect}
                        onPriceUpdate={(productId) => {
                          // Refresh products data
                          fetchQuotationAndClients();
                        }}
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Margin %</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.productName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.brand} {item.modelName}
                            </div>
                            <div className="text-xs text-gray-400">
                              Vendor: {item.vendorName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20"
                            min="1"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.vendorCost}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "vendorCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.profitMargin}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "profitMargin",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20"
                            min="0"
                            step="0.1"
                          />
                        </TableCell>
                        <TableCell>{item.sellingPrice.toFixed(2)}</TableCell>
                        <TableCell>{item.lineTotal.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No items added yet. Click "Add Product" to get started.
                </div>
              )}

              {/* Optimization Suggestions */}
              {optimizationSuggestions.length > 0 && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Cost Optimization Suggestions
                  </h4>
                  <div className="space-y-3">
                    {optimizationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-3 rounded border"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {suggestion.productName}
                          </div>
                          <div className="text-xs text-gray-600">
                            Switch from {suggestion.currentVendor} to{" "}
                            {suggestion.recommendedVendor.vendor.companyName}
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            Save{" "}
                            {settings?.pricing?.currency || "BDT"}{" "}
                            {suggestion.potentialSavings.toLocaleString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applyOptimizationSuggestion(suggestion)}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          Apply
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms & Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="termsAndInstructions">Terms & Instructions</Label>
                <Textarea
                  id="termsAndInstructions"
                  value={termsAndInstructions}
                  onChange={(e) => setTermsAndInstructions(e.target.value)}
                  placeholder="Enter terms and instructions..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Quotation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{settings?.pricing?.currency || "BDT"} {subtotal.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="discount">Discount:</Label>
                    <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    id="discount"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <div className="flex justify-between text-sm">
                    <span>Discount Amount:</span>
                    <span>-{settings?.pricing?.currency || "BDT"} {discountAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportationCost">Transportation Cost:</Label>
                  <Input
                    id="transportationCost"
                    type="number"
                    value={transportationCost}
                    onChange={(e) => setTransportationCost(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%):</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <div className="flex justify-between text-sm">
                    <span>Tax Amount:</span>
                    <span>{settings?.pricing?.currency || "BDT"} {taxAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total:</span>
                    <span>{settings?.pricing?.currency || "BDT"} {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
