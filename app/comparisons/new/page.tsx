"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Camera, Download, Save, Eye } from "lucide-react";
import { IProductComparison, IComparisonItem } from "@/lib/models/ProductComparison";
import ComparisonPreview from "@/components/comparison/ComparisonPreview";
import ProductSelector from "@/components/comparison/ProductSelector";

interface ComparisonData {
  title: string;
  clientName: string;
  requirementId: string;
  comparisons: IProductComparison[];
}

export default function NewComparisonPage() {
  const [comparisonData, setComparisonData] = useState<ComparisonData>({
    title: "",
    clientName: "",
    requirementId: "",
    comparisons: []
  });

  const [products, setProducts] = useState<any[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);

  // Add a new product comparison from product selection
  const addProductFromSelection = (product: any) => {
    const formatSpecifications = (specs: any) => {
      if (!specs || typeof specs !== 'object') return '';
      
      return Object.entries(specs)
        .filter(([key, value]) => value && key !== '_id')
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    };

    const newComparison: IProductComparison = {
      productName: product.name,
      productId: product.id,
      items: [{
        brand: product.brand || '',
        model: product.model || '',
        specifications: formatSpecifications(product.specifications),
        price: 0,
        currency: 'BDT',
        image: '',
        notes: ''
      }]
    };
    
    setComparisonData(prev => ({
      ...prev,
      comparisons: [...prev.comparisons, newComparison]
    }));
    setShowProductSelector(false);
  };

  // Add a new product comparison manually
  const addProductComparison = () => {
    const newComparison: IProductComparison = {
      productName: "",
      items: []
    };
    setComparisonData(prev => ({
      ...prev,
      comparisons: [...prev.comparisons, newComparison]
    }));
    setShowProductSelector(false);
  };

  // Remove a product comparison
  const removeProductComparison = (index: number) => {
    setComparisonData(prev => ({
      ...prev,
      comparisons: prev.comparisons.filter((_, i) => i !== index)
    }));
  };

  // Update product comparison
  const updateProductComparison = (index: number, field: keyof IProductComparison, value: any) => {
    setComparisonData(prev => ({
      ...prev,
      comparisons: prev.comparisons.map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      )
    }));
  };

  // Add comparison item to a product
  const addComparisonItem = (productIndex: number) => {
    const newItem: IComparisonItem = {
      brand: "",
      model: "",
      specifications: "",
      price: 0,
      currency: "BDT",
      image: "",
      notes: ""
    };
    
    setComparisonData(prev => ({
      ...prev,
      comparisons: prev.comparisons.map((comp, i) => 
        i === productIndex 
          ? { ...comp, items: [...comp.items, newItem] }
          : comp
      )
    }));
  };

  // Remove comparison item
  const removeComparisonItem = (productIndex: number, itemIndex: number) => {
    setComparisonData(prev => ({
      ...prev,
      comparisons: prev.comparisons.map((comp, i) => 
        i === productIndex 
          ? { ...comp, items: comp.items.filter((_, j) => j !== itemIndex) }
          : comp
      )
    }));
  };

  // Update comparison item
  const updateComparisonItem = (
    productIndex: number, 
    itemIndex: number, 
    field: keyof IComparisonItem, 
    value: any
  ) => {
    setComparisonData(prev => ({
      ...prev,
      comparisons: prev.comparisons.map((comp, i) => 
        i === productIndex 
          ? {
              ...comp,
              items: comp.items.map((item, j) => 
                j === itemIndex ? { ...item, [field]: value } : item
              )
            }
          : comp
      )
    }));
  };

  // Handle image upload
  const handleImageUpload = (
    productIndex: number, 
    itemIndex: number, 
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        updateComparisonItem(productIndex, itemIndex, 'image', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate PDF
  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const response = await fetch('/api/comparisons/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comparisonData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${comparisonData.title || 'product-comparison'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Save comparison
  const saveComparison = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/comparisons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comparisonData),
      });

      if (response.ok) {
        alert('Comparison saved successfully!');
      } else {
        alert('Failed to save comparison');
      }
    } catch (error) {
      console.error('Error saving comparison:', error);
      alert('Error saving comparison');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Comparison</h1>
          
          {/* Header Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Comparison Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={comparisonData.title}
                  onChange={(e) => setComparisonData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter comparison title"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={comparisonData.clientName}
                    onChange={(e) => setComparisonData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label htmlFor="requirementId">Requirement ID</Label>
                  <Input
                    id="requirementId"
                    value={comparisonData.requirementId}
                    onChange={(e) => setComparisonData(prev => ({ ...prev, requirementId: e.target.value }))}
                    placeholder="Enter requirement ID"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button onClick={() => setShowProductSelector(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
            <Button 
              onClick={saveComparison} 
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              onClick={() => setShowPreview(true)} 
              disabled={comparisonData.comparisons.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Report
            </Button>
            <Button 
              onClick={generatePDF} 
              disabled={isGeneratingPDF || comparisonData.comparisons.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* Product Comparisons */}
        <div className="space-y-6">
          {comparisonData.comparisons.map((comparison, productIndex) => (
            <Card key={productIndex} className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex-1">
                  <Input
                    value={comparison.productName}
                    onChange={(e) => updateProductComparison(productIndex, 'productName', e.target.value)}
                    placeholder="Enter product name"
                    className="text-lg font-semibold border-none p-0 focus:ring-0"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProductComparison(productIndex)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button
                    onClick={() => addComparisonItem(productIndex)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Brand/Option
                  </Button>
                </div>

                {/* Comparison Items */}
                <div className="grid gap-4">
                  {comparison.items.map((item, itemIndex) => (
                    <Card key={itemIndex} className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium text-gray-900">Option {itemIndex + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeComparisonItem(productIndex, itemIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Brand</Label>
                            <Input
                              value={item.brand}
                              onChange={(e) => updateComparisonItem(productIndex, itemIndex, 'brand', e.target.value)}
                              placeholder="Enter brand name"
                            />
                          </div>
                          <div>
                            <Label>Model</Label>
                            <Input
                              value={item.model}
                              onChange={(e) => updateComparisonItem(productIndex, itemIndex, 'model', e.target.value)}
                              placeholder="Enter model name"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <Label>Specifications</Label>
                          <Textarea
                            value={item.specifications}
                            onChange={(e) => updateComparisonItem(productIndex, itemIndex, 'specifications', e.target.value)}
                            placeholder="Enter specifications and differences"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label>Price</Label>
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateComparisonItem(productIndex, itemIndex, 'price', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>Currency</Label>
                            <Select
                              value={item.currency}
                              onValueChange={(value) => updateComparisonItem(productIndex, itemIndex, 'currency', value)}
                            >
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

                        <div className="mt-4">
                          <Label>Image</Label>
                          <div className="flex items-center gap-4">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(productIndex, itemIndex, e)}
                              className="hidden"
                              id={`image-${productIndex}-${itemIndex}`}
                            />
                            <label
                              htmlFor={`image-${productIndex}-${itemIndex}`}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700"
                            >
                              <Camera className="w-4 h-4" />
                              Select Image
                            </label>
                            {item.image && (
                              <img
                                src={item.image}
                                alt="Product"
                                className="w-16 h-16 object-cover rounded-md border"
                              />
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <Label>Notes</Label>
                          <Textarea
                            value={item.notes || ''}
                            onChange={(e) => updateComparisonItem(productIndex, itemIndex, 'notes', e.target.value)}
                            placeholder="Additional notes"
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {comparisonData.comparisons.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 mb-4">No products added yet</p>
              <Button onClick={() => setShowProductSelector(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Product Selector Modal */}
        {showProductSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Product</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowProductSelector(false)}
                  className="p-2"
                >
                  ×
                </Button>
              </div>
              <ProductSelector
                onProductSelect={addProductFromSelection}
                onManualAdd={addProductComparison}
              />
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <ComparisonPreview
            title={comparisonData.title}
            clientName={comparisonData.clientName}
            requirementId={comparisonData.requirementId}
            comparisons={comparisonData.comparisons}
            createdBy="Current User" // You can get this from session
            onClose={() => setShowPreview(false)}
            onDownloadPDF={generatePDF}
            isGeneratingPDF={isGeneratingPDF}
          />
        )}
      </div>
    </div>
  );
}
