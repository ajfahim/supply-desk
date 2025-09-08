'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Edit, Send, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface QuotationItem {
  product: {
    _id: string;
    name: string;
    modelName: string;
    brand: string;
  };
  selectedVendor: {
    _id: string;
    companyName: string;
  };
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  vendorCost: number;
  deliveryTime: string;
  lineTotal: number;
}

interface Quotation {
  _id: string;
  quotationNumber: string;
  client: {
    _id: string;
    companyName: string;
    industry: string;
  };
  clientContact: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  discountType: string;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  status: string;
  validUntil: string;
  deliveryTerms: string;
  paymentTerms: string;
  warranty: string;
  notes: string;
  profitSummary: {
    totalCost: number;
    totalProfit: number;
    profitPercentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const quotationId = params.id as string;

  useEffect(() => {
    fetchQuotation();
  }, [quotationId]);

  const fetchQuotation = async () => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quotation');
      }
      const data = await response.json();
      setQuotation(data);
    } catch (err) {
      setError('Failed to load quotation');
      console.error('Error fetching quotation:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownloadPDF = async () => {
    if (!quotation) return;
    
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = margin;

      // Add logo
      try {
        const logoImg = new Image();
        logoImg.src = '/logo.png';
        await new Promise((resolve) => {
          logoImg.onload = resolve;
        });
        
        // Add logo (top left)
        pdf.addImage(logoImg, 'PNG', margin, currentY, 40, 20);
      } catch (error) {
        console.log('Logo not loaded, continuing without it');
      }

      // Company info (top right)
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const companyInfo = [
        'Industrial Equipment Supplier',
        'Email: info@steelroottraders.com',
        'Phone: +880-2-123456789',
        'www.steelroottraders.com'
      ];
      
      let infoY = currentY + 5;
      companyInfo.forEach(line => {
        pdf.text(line, pageWidth - margin, infoY, { align: 'right' });
        infoY += 3;
      });

      currentY += 30;

      // Quotation title with border
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, currentY, contentWidth, 10, 'F');
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(margin, currentY, contentWidth, 10);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('COMMERCIAL QUOTATION', pageWidth / 2, currentY + 7, { align: 'center' });
      currentY += 15;

      // Two column layout for TO and SHIP TO
      const leftColX = margin;
      const rightColX = pageWidth / 2 + 10;
      const colWidth = (contentWidth / 2) - 10;

      // TO section
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TO', leftColX, currentY);
      currentY += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const toLines = [
        quotation.client.companyName,
        quotation.clientContact.name,
        quotation.clientContact.title,
        quotation.clientContact.email,
        quotation.clientContact.phone
      ];

      toLines.forEach(line => {
        if (line) {
          pdf.text(line, leftColX, currentY);
          currentY += 4;
        }
      });

      // SHIP TO section (right column)
      let shipToY = currentY - (toLines.length * 4) - 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('SHIP TO', rightColX, shipToY);
      shipToY += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(quotation.client.companyName, rightColX, shipToY);
      shipToY += 4;
      pdf.text(quotation.client.industry, rightColX, shipToY);

      // Quote details (right side)
      const quoteDetailsY = shipToY + 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(`Quote Date: ${formatDate(quotation.createdAt)}`, rightColX, quoteDetailsY);
      pdf.text(`Valid For: 15 days`, rightColX, quoteDetailsY + 4);
      pdf.text(`Ref: ${quotation.quotationNumber}`, rightColX, quoteDetailsY + 8);

      currentY += 25;

      // Items table
      const tableStartY = currentY;
      const colWidths = [15, 80, 25, 15, 20, 25, 30];
      const colPositions = [margin];
      for (let i = 1; i < colWidths.length; i++) {
        colPositions.push(colPositions[i-1] + colWidths[i-1]);
      }

      // Table header
      pdf.setFillColor(70, 130, 180); // Steel blue
      pdf.rect(margin, currentY, contentWidth, 8, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      
      const headers = ['SL', 'Item', 'Size', 'Unit', 'Quantity', 'Unit Price\n(Supply)', 'Total Price (Supply)'];
      headers.forEach((header, i) => {
        const x = colPositions[i] + (colWidths[i] / 2);
        pdf.text(header, x, currentY + 5, { align: 'center' });
      });
      
      currentY += 10;

      // Table rows
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      
      quotation.items.forEach((item, index) => {
        if (currentY > pageHeight - 50) {
          pdf.addPage();
          currentY = margin;
        }

        const rowHeight = 20;
        
        // Alternate row colors
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
        }

        // Draw borders
        pdf.setDrawColor(200, 200, 200);
        for (let i = 0; i < colPositions.length; i++) {
          pdf.line(colPositions[i], currentY, colPositions[i], currentY + rowHeight);
        }
        pdf.line(margin + contentWidth, currentY, margin + contentWidth, currentY + rowHeight);
        pdf.line(margin, currentY, margin + contentWidth, currentY);
        pdf.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

        // Row content
        pdf.setFontSize(8);
        
        // SL
        pdf.text((index + 1).toString(), colPositions[0] + (colWidths[0] / 2), currentY + 5, { align: 'center' });
        
        // Item (with specifications)
        const itemText = item.product.name;
        const specText = `${item.product.brand || ''} ${item.product.modelName || ''}`.trim();
        const vendorText = `Vendor: ${item.selectedVendor?.companyName || 'N/A'}`;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(itemText, colPositions[1] + 2, currentY + 5);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.text(specText, colPositions[1] + 2, currentY + 9);
        pdf.text(vendorText, colPositions[1] + 2, currentY + 13);
        
        pdf.setFontSize(8);
        
        // Size (using model name)
        pdf.text(item.product.modelName || '-', colPositions[2] + (colWidths[2] / 2), currentY + 8, { align: 'center' });
        
        // Unit
        pdf.text('PC', colPositions[3] + (colWidths[3] / 2), currentY + 8, { align: 'center' });
        
        // Quantity
        pdf.text(item.quantity.toString(), colPositions[4] + (colWidths[4] / 2), currentY + 8, { align: 'center' });
        
        // Unit Price
        pdf.text(formatCurrency(item.sellingPrice).replace('BDT', ''), colPositions[5] + (colWidths[5] / 2), currentY + 8, { align: 'center' });
        
        // Total Price
        pdf.setFont('helvetica', 'bold');
        pdf.text(formatCurrency(item.lineTotal).replace('BDT', ''), colPositions[6] + (colWidths[6] / 2), currentY + 8, { align: 'center' });
        
        currentY += rowHeight;
      });

      // Table footer with totals
      currentY += 5;
      const totalsStartX = colPositions[4];
      const totalsWidth = colWidths[4] + colWidths[5] + colWidths[6];
      
      // Subtotal
      pdf.setFillColor(240, 240, 240);
      pdf.rect(totalsStartX, currentY, totalsWidth, 6, 'F');
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(totalsStartX, currentY, totalsWidth, 6);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUBTOTAL', totalsStartX + 5, currentY + 4);
      pdf.text(formatCurrency(quotation.subtotal).replace('BDT', ''), totalsStartX + totalsWidth - 5, currentY + 4, { align: 'right' });
      currentY += 6;

      if (quotation.discount > 0) {
        pdf.rect(totalsStartX, currentY, totalsWidth, 6);
        pdf.text('DISCOUNT', totalsStartX + 5, currentY + 4);
        pdf.text(`-${formatCurrency(quotation.discount).replace('BDT', '')}`, totalsStartX + totalsWidth - 5, currentY + 4, { align: 'right' });
        currentY += 6;
      }

      if (quotation.taxAmount > 0) {
        pdf.rect(totalsStartX, currentY, totalsWidth, 6);
        pdf.text(`VAT RATE ${quotation.taxRate}%`, totalsStartX + 5, currentY + 4);
        pdf.text(formatCurrency(quotation.taxAmount).replace('BDT', ''), totalsStartX + totalsWidth - 5, currentY + 4, { align: 'right' });
        currentY += 6;
      }

      // Grand Total
      pdf.setFillColor(70, 130, 180);
      pdf.rect(totalsStartX, currentY, totalsWidth, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Quote Total', totalsStartX + 5, currentY + 5);
      pdf.text(`BDT ${formatCurrency(quotation.grandTotal).replace('BDT', '')}`, totalsStartX + totalsWidth - 5, currentY + 5, { align: 'right' });
      
      currentY += 15;

      // Terms & Instructions
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Terms & Instructions', margin, currentY);
      currentY += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const terms = [
        '50% Advance with Work order, rest after delivery',
        'Delivery time: Supply 3-5 days After Getting PO',
        'The Price included 5% AIT & 10% VAT'
      ];

      terms.forEach(term => {
        pdf.text(term, margin, currentY);
        currentY += 4;
      });

      // Add custom terms if available
      if (quotation.deliveryTerms) {
        pdf.text(`Delivery: ${quotation.deliveryTerms}`, margin, currentY);
        currentY += 4;
      }
      if (quotation.paymentTerms) {
        pdf.text(`Payment: ${quotation.paymentTerms}`, margin, currentY);
        currentY += 4;
      }
      if (quotation.warranty) {
        pdf.text(`Warranty: ${quotation.warranty}`, margin, currentY);
        currentY += 4;
      }

      currentY += 10;

      // Footer signature area
      const footerY = pageHeight - 40;
      pdf.setFontSize(8);
      pdf.text('Authorized by', pageWidth - 50, footerY);
      pdf.line(pageWidth - 50, footerY + 10, pageWidth - 10, footerY + 10);
      
      // Company stamp area (left side)
      pdf.text('Thank you for your business!', margin, footerY);
      pdf.setFont('helvetica', 'bold');
      pdf.text('STEELROOT TRADERS', margin, footerY + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Your Trusted Industrial Equipment Partner', margin, footerY + 9);

      // Save the PDF
      pdf.save(`${quotation.quotationNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quotation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quotation Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The requested quotation could not be found.'}</p>
            <Button onClick={() => router.push('/quotations')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        {/* Top row with back button and actions */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => router.push('/quotations')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(quotation.status)}>
              {quotation.status.toUpperCase()}
            </Badge>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'PDF'}
            </Button>
            <Button size="sm">
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
        
        {/* Second row with title and date */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {quotation.quotationNumber}
          </h1>
          <p className="text-gray-600">
            Created on {formatDate(quotation.createdAt)}
          </p>
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
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{quotation.client.companyName}</h3>
                  <p className="text-gray-600">{quotation.client.industry}</p>
                </div>
                <div>
                  <h4 className="font-medium">Contact Person</h4>
                  <p className="text-sm">{quotation.clientContact.name}</p>
                  <p className="text-sm text-gray-600">{quotation.clientContact.title}</p>
                  <p className="text-sm text-gray-600">{quotation.clientContact.email}</p>
                  <p className="text-sm text-gray-600">{quotation.clientContact.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Quotation Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product</th>
                      <th className="text-center py-2">Qty</th>
                      <th className="text-right py-2">Unit Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.product.brand} - {item.product.modelName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Vendor: {item.selectedVendor?.companyName || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="text-center py-3">{item.quantity}</td>
                        <td className="text-right py-3">{formatCurrency(item.sellingPrice)}</td>
                        <td className="text-right py-3 font-medium">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Discount ({quotation.discountType === 'percentage' ? `${quotation.discount}%` : 'Fixed'}):
                    </span>
                    <span>-{formatCurrency(quotation.discount)}</span>
                  </div>
                )}
                {quotation.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({quotation.taxRate}%):</span>
                    <span>{formatCurrency(quotation.taxAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(quotation.grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quotation.deliveryTerms && (
                <div>
                  <h4 className="font-medium mb-1">Delivery Terms</h4>
                  <p className="text-sm text-gray-600">{quotation.deliveryTerms}</p>
                </div>
              )}
              {quotation.paymentTerms && (
                <div>
                  <h4 className="font-medium mb-1">Payment Terms</h4>
                  <p className="text-sm text-gray-600">{quotation.paymentTerms}</p>
                </div>
              )}
              {quotation.warranty && (
                <div>
                  <h4 className="font-medium mb-1">Warranty</h4>
                  <p className="text-sm text-gray-600">{quotation.warranty}</p>
                </div>
              )}
              {quotation.notes && (
                <div>
                  <h4 className="font-medium mb-1">Notes</h4>
                  <p className="text-sm text-gray-600">{quotation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Validity */}
          <Card>
            <CardHeader>
              <CardTitle>Quotation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Badge className={`${getStatusColor(quotation.status)} ml-2`}>
                  {quotation.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Valid Until</label>
                <p className="text-sm text-gray-600">{formatDate(quotation.validUntil)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Last Updated</label>
                <p className="text-sm text-gray-600">{formatDate(quotation.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Profit Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profit Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Total Cost:</span>
                <span className="text-sm font-medium">
                  {formatCurrency(quotation.profitSummary.totalCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Profit:</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(quotation.profitSummary.totalProfit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Profit Margin:</span>
                <span className="text-sm font-bold text-green-600">
                  {quotation.profitSummary.profitPercentage.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Quotation
              </Button>
              <Button className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Send to Client
              </Button>
              <Button className="w-full" variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
