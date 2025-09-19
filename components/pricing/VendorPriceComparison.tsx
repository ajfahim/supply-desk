"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface Vendor {
  _id: string;
  companyName: string;
  reliability: number;
  deliveryTime: string;
  paymentTerms: string;
}

interface VendorPrice {
  vendor: Vendor;
  price: number;
  currency: string;
  validUntil: Date;
  minimumQuantity: number;
  deliveryTime: string;
  lastUpdated: Date;
}

interface Product {
  _id: string;
  name: string;
  brand: string;
  modelName: string;
  vendorPrices: VendorPrice[];
}

interface VendorPriceComparisonProps {
  product: Product;
  onPriceSelect?: (vendorPrice: VendorPrice) => void;
  onPriceUpdate?: (productId: string) => void;
}

export default function VendorPriceComparison({
  product,
  onPriceSelect,
  onPriceUpdate,
}: VendorPriceComparisonProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showAddPriceDialog, setShowAddPriceDialog] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState({
    vendor: "",
    price: "",
    currency: "BDT",
    validUntil: "",
    minimumQuantity: "1",
    deliveryTime: "",
  });
  const [editForm, setEditForm] = useState({
    price: "",
    currency: "BDT",
    validUntil: "",
    minimumQuantity: "1",
    deliveryTime: "",
  });

  useEffect(() => {
    fetchVendors();
    // Set default valid until date (90 days from now)
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 90);
    setNewPrice(prev => ({
      ...prev,
      validUntil: defaultDate.toISOString().split("T")[0],
    }));
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      const data = await response.json();
      setVendors(data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const sortedPrices = [...product.vendorPrices].sort((a, b) => {
    // First sort by price (ascending)
    if (a.price !== b.price) return a.price - b.price;
    // Then by vendor reliability (descending)
    return (b.vendor.reliability || 0) - (a.vendor.reliability || 0);
  });

  const getBestPrice = () => {
    if (sortedPrices.length === 0) return null;
    return sortedPrices[0];
  };

  const getPriceRank = (price: VendorPrice) => {
    const index = sortedPrices.findIndex(p => p === price);
    return index + 1;
  };

  const getPriceDifference = (price: VendorPrice) => {
    const bestPrice = getBestPrice();
    if (!bestPrice || price === bestPrice) return 0;
    return ((price.price - bestPrice.price) / bestPrice.price) * 100;
  };

  const isExpiringSoon = (validUntil: Date) => {
    const now = new Date();
    const expiry = new Date(validUntil);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  };

  const handleAddPrice = async () => {
    try {
      const response = await fetch(`/api/products/${product._id}/vendor-prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor: newPrice.vendor,
          price: parseFloat(newPrice.price),
          currency: newPrice.currency,
          validUntil: new Date(newPrice.validUntil),
          minimumQuantity: parseInt(newPrice.minimumQuantity),
          deliveryTime: newPrice.deliveryTime,
        }),
      });

      if (response.ok) {
        setShowAddPriceDialog(false);
        setNewPrice({
          vendor: "",
          price: "",
          currency: "BDT",
          validUntil: "",
          minimumQuantity: "1",
          deliveryTime: "",
        });
        onPriceUpdate?.(product._id);
      }
    } catch (error) {
      console.error("Error adding vendor price:", error);
    }
  };

  const handleDeletePrice = async (vendorId: string) => {
    try {
      const response = await fetch(
        `/api/products/${product._id}/vendor-prices/${vendorId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        onPriceUpdate?.(product._id);
      }
    } catch (error) {
      console.error("Error deleting vendor price:", error);
    }
  };

  const startEditPrice = (vendorPrice: VendorPrice) => {
    setEditingVendorId(vendorPrice.vendor._id);
    setEditForm({
      price: vendorPrice.price.toString(),
      currency: vendorPrice.currency,
      validUntil: new Date(vendorPrice.validUntil).toISOString().split("T")[0],
      minimumQuantity: vendorPrice.minimumQuantity.toString(),
      deliveryTime: vendorPrice.deliveryTime,
    });
  };

  const handleEditPrice = async () => {
    if (!editingVendorId) return;

    try {
      const response = await fetch(
        `/api/products/${product._id}/vendor-prices/${editingVendorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            price: parseFloat(editForm.price),
            currency: editForm.currency,
            validUntil: new Date(editForm.validUntil),
            minimumQuantity: parseInt(editForm.minimumQuantity),
            deliveryTime: editForm.deliveryTime,
          }),
        }
      );

      if (response.ok) {
        setEditingVendorId(null);
        onPriceUpdate?.(product._id);
      }
    } catch (error) {
      console.error("Error updating vendor price:", error);
    }
  };

  const cancelEdit = () => {
    setEditingVendorId(null);
    setEditForm({
      price: "",
      currency: "BDT",
      validUntil: "",
      minimumQuantity: "1",
      deliveryTime: "",
    });
  };

  const getReliabilityBadge = (reliability: number) => {
    if (reliability >= 4.5) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (reliability >= 4) return <Badge className="bg-blue-100 text-blue-800">Very Good</Badge>;
    if (reliability >= 3) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Fair</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Vendor Price Comparison
        </CardTitle>
        <Dialog open={showAddPriceDialog} onOpenChange={setShowAddPriceDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Price
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Vendor Price</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Vendor</Label>
                <Select value={newPrice.vendor} onValueChange={(value) => 
                  setNewPrice(prev => ({ ...prev, vendor: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor._id} value={vendor._id}>
                        {vendor.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={newPrice.price}
                    onChange={(e) => setNewPrice(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={newPrice.currency} onValueChange={(value) => 
                    setNewPrice(prev => ({ ...prev, currency: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={newPrice.validUntil}
                    onChange={(e) => setNewPrice(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Min Quantity</Label>
                  <Input
                    type="number"
                    value={newPrice.minimumQuantity}
                    onChange={(e) => setNewPrice(prev => ({ ...prev, minimumQuantity: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Delivery Time</Label>
                <Input
                  value={newPrice.deliveryTime}
                  onChange={(e) => setNewPrice(prev => ({ ...prev, deliveryTime: e.target.value }))}
                  placeholder="e.g., 2-3 weeks"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddPriceDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPrice} disabled={!newPrice.vendor || !newPrice.price}>
                  Add Price
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sortedPrices.length > 0 ? (
          <div className="space-y-4">
            {/* Best Price Highlight */}
            {getBestPrice() && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Best Price</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onPriceSelect?.(getBestPrice()!)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Select Best Price
                  </Button>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-green-800">
                    {getBestPrice()!.price.toLocaleString()} {getBestPrice()!.currency}
                  </span>
                  <span className="ml-2 text-green-600">
                    by {getBestPrice()!.vendor.companyName}
                  </span>
                </div>
              </div>
            )}

            {/* Price Comparison Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Reliability</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPrices.map((vendorPrice, index) => {
                  const rank = getPriceRank(vendorPrice);
                  const difference = getPriceDifference(vendorPrice);
                  const isExpiring = isExpiringSoon(vendorPrice.validUntil);

                  return (
                    <TableRow key={`${vendorPrice.vendor._id}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {rank === 1 && <Award className="h-4 w-4 text-yellow-500" />}
                          <span className={rank === 1 ? "font-bold text-green-600" : ""}>
                            #{rank}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vendorPrice.vendor.companyName}</div>
                          <div className="text-sm text-gray-500">
                            Min qty: {vendorPrice.minimumQuantity}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingVendorId === vendorPrice.vendor._id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editForm.price}
                              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                              className="w-24"
                              placeholder="Price"
                            />
                            <select
                              value={editForm.currency}
                              onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                              className="border rounded px-2 py-1"
                            >
                              <option value="BDT">BDT</option>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">
                              {vendorPrice.price.toLocaleString()} {vendorPrice.currency}
                            </span>
                            {vendorPrice === getBestPrice() && (
                              <Badge className="bg-green-100 text-green-800">
                                Best Price
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getReliabilityBadge(vendorPrice.vendor.reliability)}
                      </TableCell>
                      <TableCell>
                        {editingVendorId === vendorPrice.vendor._id ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.deliveryTime}
                              onChange={(e) => setEditForm({ ...editForm, deliveryTime: e.target.value })}
                              placeholder="Delivery time"
                              className="w-32"
                            />
                            <Input
                              type="number"
                              value={editForm.minimumQuantity}
                              onChange={(e) => setEditForm({ ...editForm, minimumQuantity: e.target.value })}
                              placeholder="Min qty"
                              className="w-20"
                            />
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div>{vendorPrice.deliveryTime}</div>
                            <div className="text-gray-500">
                              Min qty: {vendorPrice.minimumQuantity}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingVendorId === vendorPrice.vendor._id ? (
                          <Input
                            type="date"
                            value={editForm.validUntil}
                            onChange={(e) => setEditForm({ ...editForm, validUntil: e.target.value })}
                            className="w-36"
                          />
                        ) : (
                          <div className="text-sm">
                            {new Date(vendorPrice.validUntil).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingVendorId === vendorPrice.vendor._id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleEditPrice}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => onPriceSelect?.(vendorPrice)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Select
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditPrice(vendorPrice)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeletePrice(vendorPrice.vendor._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No vendor prices available for this product.</p>
            <p className="text-sm">Add vendor prices to compare and find the best deals.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
