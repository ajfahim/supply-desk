"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Edit, Plus, Search, Trash2, Package } from "lucide-react";
import { useEffect, useState } from "react";

interface Product {
  _id: string;
  name: string;
  brand: string;
  modelName: string;
  category: {
    _id: string;
    name: string;
  };
  description: string;
  specifications: Record<string, any>;
  unit: string;
  hsCode: string;
  vendorPrices: Array<{
    vendor: {
      _id: string;
      companyName: string;
    };
    price: number;
    currency: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  name: string;
  description: string;
}

interface Vendor {
  _id: string;
  companyName: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    modelName: "",
    category: "",
    description: "",
    specifications: {} as Record<string, string>,
    unit: "pcs",
    hsCode: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchVendors();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct._id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchProducts();
        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand || "",
      modelName: product.modelName || "",
      category: product.category._id,
      description: product.description || "",
      specifications: product.specifications || {},
      unit: product.unit,
      hsCode: product.hsCode || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchProducts();
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      brand: "",
      modelName: "",
      category: "",
      description: "",
      specifications: {},
      unit: "pcs",
      hsCode: "",
    });
  };

  const addSpecification = () => {
    const key = prompt("Enter specification key:");
    const value = prompt("Enter specification value:");
    if (key && value) {
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [key]: value,
        },
      });
    }
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData({
      ...formData,
      specifications: newSpecs,
    });
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.modelName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category._id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-2">
              Manage your product catalog and specifications
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="modelName">Model Name</Label>
                    <Input
                      id="modelName"
                      value={formData.modelName}
                      onChange={(e) =>
                        setFormData({ ...formData, modelName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={formData.unit || "pcs"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, unit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Count/Quantity Units */}
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                        <SelectItem value="pair">Pair</SelectItem>
                        <SelectItem value="dozen">Dozen</SelectItem>
                        
                        {/* Length Units */}
                        <SelectItem value="mm">Millimeters</SelectItem>
                        <SelectItem value="cm">Centimeters</SelectItem>
                        <SelectItem value="m">Meters</SelectItem>
                        <SelectItem value="km">Kilometers</SelectItem>
                        <SelectItem value="inch">Inches</SelectItem>
                        <SelectItem value="ft">Feet</SelectItem>
                        <SelectItem value="yard">Yards</SelectItem>
                        
                        {/* Area Units */}
                        <SelectItem value="sqmm">Square Millimeters</SelectItem>
                        <SelectItem value="sqcm">Square Centimeters</SelectItem>
                        <SelectItem value="sqm">Square Meters</SelectItem>
                        <SelectItem value="sqkm">Square Kilometers</SelectItem>
                        <SelectItem value="sqin">Square Inches</SelectItem>
                        <SelectItem value="sqft">Square Feet</SelectItem>
                        <SelectItem value="sqyard">Square Yards</SelectItem>
                        <SelectItem value="acre">Acres</SelectItem>
                        
                        {/* Volume Units */}
                        <SelectItem value="ml">Milliliters</SelectItem>
                        <SelectItem value="l">Liters</SelectItem>
                        <SelectItem value="gallon">Gallons</SelectItem>
                        <SelectItem value="cuft">Cubic Feet</SelectItem>
                        <SelectItem value="cum">Cubic Meters</SelectItem>
                        
                        {/* Weight Units */}
                        <SelectItem value="g">Grams</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="ton">Tons</SelectItem>
                        <SelectItem value="lb">Pounds</SelectItem>
                        <SelectItem value="oz">Ounces</SelectItem>
                        
                        {/* Packaging Units */}
                        <SelectItem value="packet">Packet</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="carton">Carton</SelectItem>
                        <SelectItem value="bag">Bag</SelectItem>
                        <SelectItem value="sack">Sack</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="can">Can</SelectItem>
                        <SelectItem value="jar">Jar</SelectItem>
                        <SelectItem value="tube">Tube</SelectItem>
                        <SelectItem value="roll">Roll</SelectItem>
                        <SelectItem value="sheet">Sheet</SelectItem>
                        <SelectItem value="bundle">Bundle</SelectItem>
                        <SelectItem value="coil">Coil</SelectItem>
                        
                        {/* Other Common Units */}
                        <SelectItem value="each">Each</SelectItem>
                        <SelectItem value="unit">Unit</SelectItem>
                        <SelectItem value="lot">Lot</SelectItem>
                        <SelectItem value="batch">Batch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hsCode">HS Code</Label>
                    <Input
                      id="hsCode"
                      value={formData.hsCode}
                      onChange={(e) =>
                        setFormData({ ...formData, hsCode: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Specifications</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSpecification}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Spec
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Object.entries(formData.specifications).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                        >
                          <span className="font-medium text-sm">{key}:</span>
                          <span className="text-sm">{value}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSpecification(key)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProduct ? "Update" : "Create"} Product
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={selectedCategory || "all"}
                onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Products ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Vendors</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.brand && (
                          <div className="text-sm text-gray-500">
                            {product.brand}
                            {product.modelName && ` - ${product.modelName}`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {product.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {product.vendorPrices.length} vendor(s)
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No products found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
