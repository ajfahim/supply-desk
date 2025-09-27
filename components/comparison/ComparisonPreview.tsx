"use client";

import { IProductComparison } from "@/lib/models/ProductComparison";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface ComparisonPreviewProps {
  title: string;
  clientName?: string;
  requirementId?: string;
  comparisons: IProductComparison[];
  createdBy: string;
  onClose: () => void;
  onDownloadPDF: () => void;
  isGeneratingPDF: boolean;
}

export default function ComparisonPreview({
  title,
  clientName,
  requirementId,
  comparisons,
  createdBy,
  onClose,
  onDownloadPDF,
  isGeneratingPDF
}: ComparisonPreviewProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Comparison Report Preview</h2>
          <div className="flex gap-2">
            <Button
              onClick={onDownloadPDF}
              disabled={isGeneratingPDF}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Report Header */}
          <div className="mb-8 pb-6 border-b-2 border-blue-600">
            <h1 className="text-3xl font-bold text-blue-900 mb-4">{title}</h1>
            {clientName && (
              <p className="text-gray-600 mb-2">Client: {clientName}</p>
            )}
            {requirementId && (
              <p className="text-gray-600 mb-2">Requirement ID: {requirementId}</p>
            )}
            
            <div className="flex justify-end items-start mt-4">
              <div className="text-right text-sm text-gray-600">
                <p>Generated: {formatDate(new Date())}</p>
                <p>By: {createdBy}</p>
              </div>
            </div>
          </div>

          {/* Product Comparisons */}
          <div className="space-y-8">
            {comparisons.map((comparison, index) => (
              <div key={index} className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
                  {comparison.productName}
                </h3>
                
                {comparison.items.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      {/* Table Header */}
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700 w-40">
                            Image
                          </th>
                          <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700 w-40">
                            Brand & Model
                          </th>
                          <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700">
                            Specifications
                          </th>
                          <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700 w-32">
                            Price
                          </th>
                          <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700 w-24">
                            Notes
                          </th>
                        </tr>
                      </thead>

                      {/* Table Body */}
                      <tbody>
                        {comparison.items.map((item, itemIndex) => (
                          <tr key={itemIndex} className="hover:bg-gray-50">
                            {/* Image Cell */}
                            <td className="border border-gray-300 p-3 text-center w-40">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt="Product"
                                  className="w-32 h-32 object-cover rounded border mx-auto"
                                />
                              ) : (
                                <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center mx-auto">
                                  <span className="text-xs text-gray-500">No Image</span>
                                </div>
                              )}
                            </td>

                            {/* Brand & Model Cell */}
                            <td className="border border-gray-300 p-3 w-40">
                              <div className="font-semibold text-gray-900 mb-1 break-words">{item.brand}</div>
                              <div className="text-sm text-gray-600 break-words">{item.model || '-'}</div>
                            </td>

                            {/* Specifications Cell */}
                            <td className="border border-gray-300 p-3">
                              <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                {item.specifications}
                              </div>
                            </td>

                            {/* Price Cell */}
                            <td className="border border-gray-300 p-3 w-32">
                              <div className="font-semibold text-green-600 break-words">
                                {formatPrice(item.price, item.currency)}
                              </div>
                            </td>

                            {/* Notes Cell */}
                            <td className="border border-gray-300 p-3 w-24">
                              <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                {item.notes || '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
            This comparison report was generated by Supply Desk - Steelroot Traders
          </div>
        </div>
      </div>
    </div>
  );
}
