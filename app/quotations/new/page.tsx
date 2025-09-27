"use client";

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
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  deliveryTime: string;
  warranty: string;
  notes: string;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [selectedProductForPricing, setSelectedProductForPricing] =
    useState<Product | null>(null);
  const [vendorPrice, setVendorPrice] = useState("");
  const [profitMargin, setProfitMargin] = useState("15");
  const [settings, setSettings] = useState<any>(null);
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  const [selectedProductForComparison, setSelectedProductForComparison] =
    useState<Product | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<any[]>(
    []
  );

  // Form fields
  const [validUntil, setValidUntil] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("FOB Destination");
  const [paymentTerms, setPaymentTerms] = useState("30 days");
  const [warranty, setWarranty] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAndInstructions, setTermsAndInstructions] = useState(
    "50% Advance with the Work order, the rest after delivery\nDelivery time: Supply 3-5 days After Getting the PO\nThe Price included 5% AIT & 10% VAT"
  );
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [transportationCost, setTransportationCost] = useState(0);
  const [taxRate, setTaxRate] = useState(10);

  useEffect(() => {
    fetchClientsAndProducts();
    fetchSettings();

    // Set default valid until date (30 days from now)
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setValidUntil(defaultDate.toISOString().split("T")[0]);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        // Set default tax rate from settings or fallback to 10
        setTaxRate(data.pricing?.defaultTaxRate || 10);
        // Set default profit margin from settings
        setProfitMargin(String(data.pricing?.defaultProfitMargin || 15));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    // Generate optimization suggestions when items change
    if (items.length > 0) {
      const suggestions =
        PricingRecommendationEngine.generateQuotationOptimizationSuggestions(
          items.map((item) => {
            const product = products.find((p) => p._id === item.product);
            return {
              product: item.product,
              productName: item.productName,
              quantity: item.quantity,
              selectedVendor: item.selectedVendor,
              vendorCost: item.vendorCost,
              vendorPrices:
                product?.vendorPrices?.map((vp) => ({
                  vendor: {
                    _id: vp.vendor._id,
                    companyName: vp.vendor.companyName,
                    reliability: vp.vendor.reliability || 3,
                    deliveryTime: vp.vendor.deliveryTime || "",
                    paymentTerms: vp.vendor.paymentTerms || "",
                  },
                  price: vp.price,
                  currency: vp.currency,
                  validUntil: vp.validUntil
                    ? new Date(vp.validUntil)
                    : new Date(),
                  minimumQuantity: vp.minimumQuantity || 1,
                  deliveryTime: vp.deliveryTime,
                  lastUpdated: vp.lastUpdated
                    ? new Date(vp.lastUpdated)
                    : new Date(),
                })) || [],
            };
          })
        );
      setOptimizationSuggestions(suggestions);
    } else {
      setOptimizationSuggestions([]);
    }
  }, [items, products]);

  const fetchClientsAndProducts = async () => {
    try {
      const [clientsResponse, productsResponse, settingsResponse] =
        await Promise.all([
          fetch("/api/clients"),
          fetch("/api/products"),
          fetch("/api/settings"),
        ]);

      const clientsData = await clientsResponse.json();
      const productsData = await productsResponse.json();
      const settingsData = await settingsResponse.json();

      setClients(clientsData || []);
      setProducts(productsData || []);
      setSettings(settingsData);

      if (settingsData?.pricing?.defaultProfitMargin) {
        setProfitMargin(settingsData.pricing.defaultProfitMargin.toString());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
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
      unitPrice: pricing.sellingPrice,
      unit: selectedProductForPricing.unit,
      selectedVendor: "",
      vendorName: "",
      vendorCost: 0,
      vendorCurrency: "BDT",
      profitMargin: 15,
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

  const addProduct = (product: Product, vendorIndex: number) => {
    const vendor = product.vendorPrices[vendorIndex];
    const newItem: QuotationItem = {
      product: product._id,
      productName: product.name,
      brand: product.brand,
      modelName: product.modelName,
      quantity: 1,
      unit: product.unit,
      selectedVendor: vendor.vendor._id,
      vendorName: vendor.vendor.companyName,
      vendorCost: vendor.price,
      vendorCurrency: vendor.currency,
      profitMargin: settings?.pricing?.defaultProfitMargin || 15, // Default margin from settings
      sellingPrice: vendor.price * (1 + (settings?.pricing?.defaultProfitMargin || 15) / 100),
      lineTotal: vendor.price * (1 + (settings?.pricing?.defaultProfitMargin || 15) / 100),
      deliveryTime: vendor.deliveryTime,
      warranty: "",
      notes: "",
    };

    setItems([...items, newItem]);
    setShowProductDialog(false);
    setProductSearch("");
  };

  const updateItem = (
    index: number,
    field: keyof QuotationItem,
    value: any
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate prices when quantity or margin changes
    if (
      field === "quantity" ||
      field === "profitMargin" ||
      field === "vendorCost"
    ) {
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

  const handleSubmit = async () => {
    if (!selectedClient || !selectedContact || items.length === 0) {
      alert("Please fill in all required fields and add at least one item.");
      return;
    }

    setLoading(true);
    try {
      const quotationData = {
        client: selectedClient,
        clientContact: selectedContact,
        items,
        validUntil,
        deliveryTerms,
        paymentTerms,
        warranty,
        termsAndInstructions,
        notes,
        discount,
        discountType,
        transportationCost,
        taxRate,
        createdBy: "System User", // Replace with actual user
      };

      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quotationData),
      });

      if (response.ok) {
        const quotation = await response.json();
        router.push(`/quotations/${quotation._id}`);
      } else {
        throw new Error("Failed to create quotation");
      }
    } catch (error) {
      console.error("Error creating quotation:", error);
      alert("Failed to create quotation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, discountAmount, taxAmount, grandTotal } = calculateTotals();

  const filteredProducts =
    products?.filter(
      (product) =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.brand?.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.modelName?.toLowerCase().includes(productSearch.toLowerCase())
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

  const selectedClientData = clients?.find((c) => c._id === selectedClient);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Quotation</h1>
          <p className="text-gray-600 mt-1">
            Create a new quotation for your client
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !selectedClient ||
              !selectedContact ||
              items.length === 0
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Creating..." : "Create Quotation"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
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
              <Dialog
                open={showProductDialog}
                onOpenChange={setShowProductDialog}
              >
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
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
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
                                          const vendorIndex =
                                            product.vendorPrices.findIndex(
                                              (vp) =>
                                                vp.vendor._id ===
                                                product.lowestPriceVendor.vendor
                                                  ._id
                                            );
                                          addProduct(product, vendorIndex);
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
                                {productSearch
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
                          fetchClientsAndProducts();
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
                            variant="ghost"
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
            </CardContent>
          </Card>

          {/* Optimization Suggestions */}
          {optimizationSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Cost Optimization Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizationSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-yellow-800">
                            {suggestion.productName}
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 mb-2">
                          Switch to{" "}
                          <strong>
                            {suggestion.recommendedVendor.vendor.companyName}
                          </strong>{" "}
                          to save{" "}
                          <strong>
                            {suggestion.potentialSavings.toFixed(2)} BDT
                          </strong>{" "}
                          ({suggestion.savingsPercentage.toFixed(1)}%)
                        </p>
                        <div className="text-xs text-yellow-600">
                          Current: {suggestion.currentCost.toFixed(2)} BDT →
                          Recommended:{" "}
                          {(
                            suggestion.currentCost - suggestion.potentialSavings
                          ).toFixed(2)}{" "}
                          BDT
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => applyOptimizationSuggestion(suggestion)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        Total Potential Savings:{" "}
                        {optimizationSuggestions
                          .reduce((sum, s) => sum + s.potentialSavings, 0)
                          .toFixed(2)}{" "}
                        BDT
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="termsAndInstructions">
                  Terms & Instructions
                </Label>
                <Textarea
                  value={termsAndInstructions}
                  onChange={(e) => setTermsAndInstructions(e.target.value)}
                  placeholder="Terms and instructions for the quotation..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Totals */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Quotation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{subtotal.toFixed(2)} BDT</span>
                </div>

                <div className="space-y-2">
                  <Label>Discount</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) =>
                        setDiscount(parseFloat(e.target.value) || 0)
                      }
                      className="flex-1"
                      min="0"
                      step="0.01"
                    />
                    <Select
                      value={discountType}
                      onValueChange={(value: "percentage" | "fixed") =>
                        setDiscountType(value)
                      }
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">BDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount Amount:</span>
                    <span>-{discountAmount.toFixed(2)} BDT</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Transportation Cost (BDT)</Label>
                  <Input
                    type="number"
                    value={transportationCost}
                    onChange={(e) =>
                      setTransportationCost(parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    step="0.01"
                    placeholder="Optional transportation cost"
                  />
                  {transportationCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Transportation Cost:</span>
                      <span>{transportationCost.toFixed(2)} BDT</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) =>
                      setTaxRate(parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <div className="flex justify-between text-sm">
                    <span>Tax Amount:</span>
                    <span>{taxAmount.toFixed(2)} BDT</span>
                  </div>
                </div>

                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total:</span>
                  <span>{grandTotal.toFixed(2)} BDT</span>
                </div>
              </div>

              {items.length > 0 && (
                <div className="mt-4 p-3 bg-teal-50 rounded-lg">
                  <div className="text-sm font-medium text-teal-800">
                    Profit Analysis
                  </div>
                  <div className="text-xs text-teal-600 mt-1">
                    Total Cost:{" "}
                    {items
                      .reduce(
                        (sum, item) => sum + item.vendorCost * item.quantity,
                        0
                      )
                      .toFixed(2)}{" "}
                    BDT
                  </div>
                  <div className="text-xs text-teal-600">
                    Total Profit:{" "}
                    {(
                      grandTotal -
                      items.reduce(
                        (sum, item) => sum + item.vendorCost * item.quantity,
                        0
                      )
                    ).toFixed(2)}{" "}
                    BDT
                  </div>
                  <div className="text-sm font-medium text-teal-800 mt-1">
                    Avg Margin:{" "}
                    {items.length > 0
                      ? (
                          items.reduce(
                            (sum, item) => sum + item.profitMargin,
                            0
                          ) / items.length
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
