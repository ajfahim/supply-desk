"use client";

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
import {
  Calculator,
  DollarSign,
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
  vendorPrices: Array<{
    vendor: {
      _id: string;
      companyName: string;
    };
    price: number;
    currency: string;
    deliveryTime: string;
  }>;
}

interface QuotationItem {
  product: string;
  productName: string;
  brand: string;
  modelName: string;
  quantity: number;
  unit: string;
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
  const [profitMargin, setProfitMargin] = useState("25");
  const [settings, setSettings] = useState<any>(null);

  // Form fields
  const [validUntil, setValidUntil] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("FOB Destination");
  const [paymentTerms, setPaymentTerms] = useState("30 days");
  const [warranty, setWarranty] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    fetchClientsAndProducts();

    // Set default valid until date (30 days from now)
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setValidUntil(defaultDate.toISOString().split("T")[0]);
  }, []);

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
      profitMargin: 20, // Default 20% margin
      sellingPrice: vendor.price * 1.2,
      lineTotal: vendor.price * 1.2,
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
    const taxAmount = (afterDiscount * taxRate) / 100;
    const grandTotal = afterDiscount + taxAmount;

    return { subtotal, discountAmount, taxAmount, grandTotal };
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
        notes,
        discount,
        discountType,
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
                <DialogContent className="min-w-[40vw] overflow-auto overflow-x-hidden">
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
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) =>
                              product.vendorPrices.map(
                                (vendor, vendorIndex) => (
                                  <TableRow
                                    key={`${product._id}-${vendorIndex}`}
                                  >
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
                                      <div
                                        className="truncate"
                                        title={vendor.vendor.companyName}
                                      >
                                        {vendor.vendor.companyName}
                                      </div>
                                    </TableCell>
                                    <TableCell className="w-[15%]">
                                      <div className="font-medium">
                                        {vendor.price.toLocaleString()}{" "}
                                        {vendor.currency}
                                      </div>
                                    </TableCell>
                                    <TableCell className="w-[20%]">
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            addProduct(product, vendorIndex)
                                          }
                                          className="bg-blue-600 hover:bg-blue-700"
                                        >
                                          Add
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            openPricingCalculator(product)
                                          }
                                          className="flex items-center gap-1"
                                        >
                                          <Calculator className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              )
                            )
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

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryTerms">Delivery Terms</Label>
                  <Input
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="warranty">Warranty</Label>
                  <Input
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder="e.g., 1 year manufacturer warranty"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or terms..."
                  rows={3}
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
