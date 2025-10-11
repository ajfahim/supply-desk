'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Package, Building2, Plus, FolderTree, Trash2, DollarSign } from 'lucide-react';
import VendorPriceComparison from '@/components/pricing/VendorPriceComparison';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Product {
  _id: string;
  name: string;
  brand: string;
  modelName: string;
  category: { 
    _id: string;
    name: string; 
  };
  description?: string;
  specifications?: Record<string, any>;
  unit: string;
  hsCode?: string;
  vendorPrices: Array<{
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
  }>;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  parentCategory?: {
    _id: string;
    name: string;
  };
  attributes: string[];
  isActive: boolean;
}

interface Vendor {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

export default function VendorPricingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Product selection and search
  const [selectedProductForPricing, setSelectedProductForPricing] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  
  // Dialog states
  const [showAddVendorDialog, setShowAddVendorDialog] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  
  // Form states
  const [newVendor, setNewVendor] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  });
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    modelName: '',
    category: '',
    description: '',
    specifications: {} as Record<string, string>,
    unit: 'pcs',
    hsCode: '',
  });
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parentCategory: '',
    attributes: [] as string[],
    isActive: true,
  });
  
  const [newAttribute, setNewAttribute] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, vendorsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/vendors'),
        fetch('/api/categories')
      ]);

      const productsData = await productsRes.json();
      const vendorsData = await vendorsRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData);
      setVendors(vendorsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProductForPricingData = products.find(p => p._id === selectedProductForPricing);

  // Vendor management functions
  const handleAddVendor = async () => {
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVendor),
      });

      if (response.ok) {
        const newVendorData = await response.json();
        setVendors(prev => [...prev, newVendorData]);
        setShowAddVendorDialog(false);
        setNewVendor({
          companyName: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
          }
        });
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
    }
  };

  const handleProductUpdate = (productId: string) => {
    // Refresh the product data when vendor prices are updated
    fetchData();
  };

  // Product management functions
  const handleAddProduct = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const newProductData = await response.json();
        setProducts(prev => [...prev, newProductData]);
        setShowAddProductDialog(false);
        setNewProduct({
          name: '',
          brand: '',
          modelName: '',
          category: '',
          description: '',
          specifications: {},
          unit: 'pcs',
          hsCode: '',
        });
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const addProductSpecification = () => {
    const key = prompt('Enter specification key:');
    const value = prompt('Enter specification value:');
    if (key && value) {
      setNewProduct({
        ...newProduct,
        specifications: {
          ...newProduct.specifications,
          [key]: value,
        },
      });
    }
  };

  const removeProductSpecification = (key: string) => {
    const newSpecs = { ...newProduct.specifications };
    delete newSpecs[key];
    setNewProduct({
      ...newProduct,
      specifications: newSpecs,
    });
  };

  // Category management functions
  const handleAddCategory = async () => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCategory,
          parentCategory: newCategory.parentCategory === 'none' ? undefined : newCategory.parentCategory || undefined,
        }),
      });

      if (response.ok) {
        const newCategoryData = await response.json();
        setCategories(prev => [...prev, newCategoryData]);
        setShowAddCategoryDialog(false);
        setNewCategory({
          name: '',
          description: '',
          parentCategory: '',
          attributes: [],
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const addCategoryAttribute = () => {
    if (newAttribute.trim() && !newCategory.attributes.includes(newAttribute.trim())) {
      setNewCategory({
        ...newCategory,
        attributes: [...newCategory.attributes, newAttribute.trim()],
      });
      setNewAttribute('');
    }
  };

  const removeCategoryAttribute = (attribute: string) => {
    setNewCategory({
      ...newCategory,
      attributes: newCategory.attributes.filter(attr => attr !== attribute),
    });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.modelName.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading vendor pricing data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Vendor Pricing Management</h1>
            <p className="text-muted-foreground">
              Manage vendor prices, add products, categories, and vendors all in one place
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Select Product
              </CardTitle>
              <CardDescription>
                Choose a product to manage vendor pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productSearch">Search Products</Label>
                <Input
                  id="productSearch"
                  placeholder="Search by name, brand, or model..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product._id} 
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedProductForPricing === product._id 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedProductForPricing(product._id)}
                  >
                    <div>
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-gray-500">
                        {product.brand} - {product.modelName}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {product.vendorPrices?.length || 0} vendor price(s)
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Add New Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); handleAddProduct(); }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Product Name *</Label>
                          <Input
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Brand</Label>
                          <Input
                            value={newProduct.brand}
                            onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Model Name</Label>
                          <Input
                            value={newProduct.modelName}
                            onChange={(e) => setNewProduct({ ...newProduct, modelName: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Category *</Label>
                          <Select
                            value={newProduct.category || "none"}
                            onValueChange={(value) => setNewProduct({ ...newProduct, category: value === "none" ? "" : value })}
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
                        <Label>Description</Label>
                        <Textarea
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Unit</Label>
                          <Select
                            value={newProduct.unit}
                            onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
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
                          <Label>HS Code</Label>
                          <Input
                            value={newProduct.hsCode}
                            onChange={(e) => setNewProduct({ ...newProduct, hsCode: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Specifications</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addProductSpecification}>
                            <Plus className="w-3 h-3 mr-1" />
                            Add Spec
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {Object.entries(newProduct.specifications).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <span className="font-medium text-sm">{key}:</span>
                              <span className="text-sm">{value}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeProductSpecification(key)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowAddProductDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={!newProduct.name || !newProduct.category}>
                          Create Product
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <FolderTree className="h-4 w-4 mr-2" />
                      Add New Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); handleAddCategory(); }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Category Name *</Label>
                          <Input
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Parent Category</Label>
                          <Select
                            value={newCategory.parentCategory}
                            onValueChange={(value) => setNewCategory({ ...newCategory, parentCategory: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Parent (Root Category)</SelectItem>
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
                        <Label>Description</Label>
                        <Textarea
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Attributes</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            placeholder="Add attribute"
                            value={newAttribute}
                            onChange={(e) => setNewAttribute(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCategoryAttribute())}
                          />
                          <Button type="button" onClick={addCategoryAttribute} variant="outline">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {newCategory.attributes.map((attribute) => (
                            <Badge
                              key={attribute}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => removeCategoryAttribute(attribute)}
                            >
                              {attribute} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={newCategory.isActive}
                          onChange={(e) => setNewCategory({ ...newCategory, isActive: e.target.checked })}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowAddCategoryDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={!newCategory.name}>
                          Create Category
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={showAddVendorDialog} onOpenChange={setShowAddVendorDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Building2 className="h-4 w-4 mr-2" />
                      Add New Vendor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Vendor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Company Name</Label>
                        <Input
                          value={newVendor.companyName}
                          onChange={(e) => setNewVendor(prev => ({ ...prev, companyName: e.target.value }))}
                          placeholder="Enter company name"
                        />
                      </div>
                      <div>
                        <Label>Contact Person</Label>
                        <Input
                          value={newVendor.contactPerson}
                          onChange={(e) => setNewVendor(prev => ({ ...prev, contactPerson: e.target.value }))}
                          placeholder="Enter contact person name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newVendor.email}
                            onChange={(e) => setNewVendor(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="vendor@example.com"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={newVendor.phone}
                            onChange={(e) => setNewVendor(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+1234567890"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Input
                          value={newVendor.address.street}
                          onChange={(e) => setNewVendor(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, street: e.target.value }
                          }))}
                          placeholder="Street address"
                          className="mb-2"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={newVendor.address.city}
                            onChange={(e) => setNewVendor(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, city: e.target.value }
                            }))}
                            placeholder="City"
                          />
                          <Input
                            value={newVendor.address.country}
                            onChange={(e) => setNewVendor(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, country: e.target.value }
                            }))}
                            placeholder="Country"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddVendorDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddVendor}
                          disabled={!newVendor.companyName || !newVendor.contactPerson}
                        >
                          Add Vendor
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Price Management */}
          <div className="lg:col-span-2">
            {selectedProductForPricingData ? (
              <VendorPriceComparison
                product={selectedProductForPricingData}
                onPriceUpdate={handleProductUpdate}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Product Selected
                  </h3>
                  <p className="text-gray-500 text-center">
                    Select a product from the list to view and manage vendor pricing.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
