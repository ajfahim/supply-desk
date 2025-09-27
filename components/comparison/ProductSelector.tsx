"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  description: string;
  specifications: any;
  unit: string;
  category: string;
  displayName: string;
}

interface ProductSelectorProps {
  onProductSelect: (product: Product) => void;
  onManualAdd: () => void;
}

export default function ProductSelector({ onProductSelect, onManualAdd }: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchProducts]);

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setSearchQuery("");
    setProducts([]);
    setShowDropdown(false);
  };

  const formatSpecifications = (specs: any) => {
    if (!specs || typeof specs !== 'object') return '';
    
    return Object.entries(specs)
      .filter(([key, value]) => value && key !== '_id')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Label htmlFor="productSearch">Search Products</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="productSearch"
            type="text"
            placeholder="Search by product name, brand, or model..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="pl-10"
          />
        </div>

        {/* Dropdown Results */}
        {showDropdown && searchQuery && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
            {isLoading ? (
              <div className="p-3 text-center text-gray-500">Searching...</div>
            ) : products.length > 0 ? (
              products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{product.displayName}</div>
                  {product.description && (
                    <div className="text-sm text-gray-600 mt-1 truncate">
                      {product.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Category: {product.category || 'Uncategorized'}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">
                No products found. Try a different search term.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-3 text-sm text-gray-500">OR</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <Button
        onClick={onManualAdd}
        variant="outline"
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Product Manually
      </Button>
    </div>
  );
}
