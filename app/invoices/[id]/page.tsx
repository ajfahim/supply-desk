"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Download, Edit, FileText, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";

interface InvoiceItem {
  product: {
    _id: string;
    name: string;
    brand: string;
    modelName: string;
  };
  productName: string;
  brand: string;
  modelName: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  lineTotal: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  quotationNumber: string;
  purchaseOrderNumber: string;
  client: {
    _id: string;
    companyName: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  clientContact: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountType: string;
  transportationCost: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  status: string;
  dueDate: string;
  paidDate?: string;
  paidAmount?: number;
  termsAndInstructions: string;
  createdAt: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount).replace("BDT", "৳");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setInvoice(data);
        setStatus(data.status);
        setPaidAmount(data.paidAmount?.toString() || "");
        setPaidDate(data.paidDate ? new Date(data.paidDate).toISOString().split('T')[0] : "");
      } else {
        console.error("Failed to fetch invoice:", data.error);
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const updateData: any = { status };
      
      if (status === "paid" && paidAmount && paidDate) {
        updateData.paidAmount = parseFloat(paidAmount);
        updateData.paidDate = paidDate;
      }

      const response = await fetch(`/api/invoices/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await fetchInvoice();
        setEditing(false);
      } else {
        const data = await response.json();
        alert(`Failed to update invoice: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert("An error occurred while updating the invoice");
    }
  };

  const generatePDF = async () => {
    if (!invoice) return;

    setIsGeneratingPDF(true);
    try {
      // Fetch settings for company information
      let settings = null;
      try {
        const settingsResponse = await fetch("/api/settings");
        if (settingsResponse.ok) {
          settings = await settingsResponse.json();
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;
    let currentY = margin;

    // Add logo
    try {
      const logoImg = new Image();
      logoImg.src = "/logo.png";
      await new Promise((resolve) => {
        logoImg.onload = resolve;
      });

      // Add logo (top left)
      pdf.addImage(logoImg, "PNG", margin, currentY, 35, 18);
    } catch (error) {
      console.log("Logo not loaded, continuing without it");
    }

    // Company info (top right)
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    const companyInfo = [];

    // Add company name if exists
    if (settings?.company?.companyName) {
      companyInfo.push(settings.company.companyName);
    }

    // Add address if exists
    const addressParts = [];
    if (settings?.company?.address?.street)
      addressParts.push(settings.company.address.street);
    if (settings?.company?.address?.city)
      addressParts.push(settings.company.address.city);
    if (settings?.company?.address?.country)
      addressParts.push(settings.company.address.country);
    if (addressParts.length > 0) {
      companyInfo.push(addressParts.join(", "));
    }

    // Add email if exists
    if (settings?.company?.contact?.email) {
      companyInfo.push(`Email: ${settings.company.contact.email}`);
    }

    // Add phone if exists
    if (settings?.company?.contact?.phone) {
      companyInfo.push(`Phone: ${settings.company.contact.phone}`);
    }

    // Add BIN if exists
    if (settings?.company?.bin) {
      companyInfo.push(`BIN: ${settings.company.bin}`);
    }

    // Add website if exists
    if (settings?.company?.contact?.website) {
      companyInfo.push(settings.company.contact.website);
    }

    let infoY = currentY + 3;
    companyInfo.forEach((line) => {
      pdf.text(line, pageWidth - margin, infoY, { align: "right" });
      infoY += 3;
    });

    currentY += 25;

    // Invoice title with border
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, currentY, contentWidth, 8, "F");
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(margin, currentY, contentWidth, 8);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("SALES INVOICE", pageWidth / 2, currentY + 5.5, {
      align: "center",
    });
    currentY += 18; // Added more spacing below

    // Two column layout for TO and SHIP TO
    const leftColX = margin;
    const shipToContentX = pageWidth - margin - 60; // Move to far right

    // TO section
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("TO:", leftColX, currentY);
    currentY += 5;

    pdf.setFont("helvetica", "normal");
    pdf.text(invoice.client.companyName, leftColX, currentY);
    currentY += 4;

    if (invoice.client.address) {
      pdf.text(invoice.client.address.street, leftColX, currentY);
      currentY += 4;
      pdf.text(
        `${invoice.client.address.city}, ${invoice.client.address.state} ${invoice.client.address.zipCode}`,
        leftColX,
        currentY
      );
      currentY += 4;
      pdf.text(invoice.client.address.country, leftColX, currentY);
    }

    // SHIP TO section (on the right)
    let shipToY = currentY - 17;
    pdf.setFont("helvetica", "bold");
    pdf.text("SHIP TO:", shipToContentX, shipToY);
    shipToY += 5;

    pdf.setFont("helvetica", "normal");
    pdf.text(invoice.client.companyName, shipToContentX, shipToY);
    shipToY += 4;

    if (invoice.client.address) {
      pdf.text(invoice.client.address.street, shipToContentX, shipToY);
      shipToY += 4;
      pdf.text(
        `${invoice.client.address.city}, ${invoice.client.address.state} ${invoice.client.address.zipCode}`,
        shipToContentX,
        shipToY
      );
      shipToY += 4;
      pdf.text(invoice.client.address.country, shipToContentX, shipToY);
    }

    currentY += 15;

    // Invoice details section
    const detailsStartY = currentY;
    pdf.setFont("helvetica", "bold");
    pdf.text("Invoice No:", leftColX, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(invoice.invoiceNumber, leftColX + 25, currentY);
    currentY += 5;

    pdf.setFont("helvetica", "bold");
    pdf.text("Ref:", leftColX, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(invoice.quotationNumber, leftColX + 25, currentY);
    currentY += 5;

    pdf.setFont("helvetica", "bold");
    pdf.text("PO No:", leftColX, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(invoice.purchaseOrderNumber, leftColX + 25, currentY);
    currentY += 5;

    // Date section on the right
    let dateY = detailsStartY;
    pdf.setFont("helvetica", "bold");
    pdf.text("Date:", shipToContentX, dateY);
    pdf.setFont("helvetica", "normal");
    pdf.text(new Date(invoice.createdAt).toLocaleDateString(), shipToContentX + 15, dateY);
    dateY += 5;

    pdf.setFont("helvetica", "bold");
    pdf.text("Due Date:", shipToContentX, dateY);
    pdf.setFont("helvetica", "normal");
    pdf.text(new Date(invoice.dueDate).toLocaleDateString(), shipToContentX + 20, dateY);

    currentY += 10;

    // Items table header
    const colWidths = [15, 95, 15, 15, 20, 20];
    const colPositions: number[] = [];
    let totalWidth = 0;
    for (let i = 0; i < colWidths.length; i++) {
      colPositions.push(margin + totalWidth);
      totalWidth += colWidths[i];
    }

    // Table header with background
    pdf.setFillColor(70, 130, 180);
    pdf.rect(margin, currentY, contentWidth, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);

    pdf.text("SL", colPositions[0] + 2, currentY + 5.5);
    pdf.text("DESCRIPTION OF GOODS", colPositions[1] + 2, currentY + 5.5);
    pdf.text("QTY", colPositions[2] + 2, currentY + 5.5);
    pdf.text("UNIT", colPositions[3] + 2, currentY + 5.5);
    pdf.text("RATE", colPositions[4] + 2, currentY + 5.5);
    pdf.text("AMOUNT", colPositions[5] + 2, currentY + 5.5);

    currentY += 8;

    // Items with detailed specifications
    pdf.setTextColor(0, 0, 0);
    invoice.items.forEach((item, index) => {
      // Extract product details
      const brandText = item.product?.brand || '';
      const modelText = item.product?.modelName || '';
      
      // Extract specifications
      const specsLines: string[] = [];
      if ((item.product as any)?.specifications) {
        Object.entries((item.product as any).specifications).forEach(([key, value]) => {
          if (value) {
            let formattedValue = value;
            if (typeof value === 'object' && value !== null) {
              formattedValue = JSON.stringify(value);
            }
            specsLines.push(`${key}: ${formattedValue}`);
          }
        });
      }

      // Build comprehensive item description
      let fullSpecs = "";
      if (brandText) fullSpecs += `${brandText} `;
      if (modelText) fullSpecs += `${modelText}`;

      // Calculate dynamic row height
      const baseHeight = 18;
      const lineHeight = 3;
      let contentLines = 1; // Item name
      if (fullSpecs.trim()) contentLines += 1; // Brand/model line
      contentLines += specsLines.length; // All specification lines

      const rowHeight = Math.max(baseHeight, contentLines * lineHeight + 6);

      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, currentY, contentWidth, rowHeight, "F");
      }

      // Check if we need a new page for this row
      if (currentY + rowHeight > pageHeight - 60) { // Leave space for totals and footer
        pdf.addPage();
        currentY = margin;
        
        // Re-draw table header on new page
        pdf.setFillColor(70, 130, 180);
        pdf.rect(margin, currentY, contentWidth, 8, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);

        pdf.text("SL", colPositions[0] + 2, currentY + 5.5);
        pdf.text("DESCRIPTION OF GOODS", colPositions[1] + 2, currentY + 5.5);
        pdf.text("QTY", colPositions[2] + 2, currentY + 5.5);
        pdf.text("UNIT", colPositions[3] + 2, currentY + 5.5);
        pdf.text("RATE", colPositions[4] + 2, currentY + 5.5);
        pdf.text("AMOUNT", colPositions[5] + 2, currentY + 5.5);

        currentY += 8;
        pdf.setTextColor(0, 0, 0);
      }

      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, currentY, contentWidth, rowHeight, "F");
      }

      // Draw borders
      pdf.setDrawColor(200, 200, 200);
      for (let i = 0; i <= colWidths.length; i++) {
        const x = i === colWidths.length ? margin + contentWidth : colPositions[i];
        pdf.line(x, currentY, x, currentY + rowHeight);
      }
      pdf.line(margin, currentY, margin + contentWidth, currentY);
      pdf.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

      // Row content
      pdf.setFontSize(7);

      // SL
      pdf.setFont("helvetica", "normal");
      pdf.text((index + 1).toString(), colPositions[0] + 2, currentY + 4);

      // Description
      let descY = currentY + 4;
      pdf.setFont("helvetica", "bold");
      pdf.text(item.productName, colPositions[1] + 2, descY);
      descY += lineHeight;

      if (fullSpecs.trim()) {
        pdf.setFont("helvetica", "normal");
        pdf.text(fullSpecs, colPositions[1] + 2, descY);
        descY += lineHeight;
      }

      // Specifications
      pdf.setFont("helvetica", "normal");
      specsLines.forEach((spec: string) => {
        pdf.text(spec, colPositions[1] + 2, descY);
        descY += lineHeight;
      });

      // Quantity, Unit, Rate, Amount
      pdf.setFont("helvetica", "normal");
      pdf.text(item.quantity.toString(), colPositions[2] + 2, currentY + 4);
      pdf.text(item.unit, colPositions[3] + 2, currentY + 4);
      pdf.text(item.sellingPrice.toFixed(2), colPositions[4] + 2, currentY + 4);
      pdf.text(item.lineTotal.toFixed(2), colPositions[5] + 2, currentY + 4);

      currentY += rowHeight;
    });

    // Table footer with totals - align with table end
    currentY += 2;
    const totalsStartX = colPositions[3]; // Start from Quantity column (position 3)
    const tableEndX = margin + contentWidth; // Actual table end position
    const correctTotalsWidth = tableEndX - totalsStartX; // Calculate correct width

    // Subtotal
    pdf.setFillColor(240, 240, 240);
    pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5, "F");
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("SUBTOTAL", totalsStartX + 2, currentY + 3.5);
    pdf.text(
      invoice.subtotal.toFixed(2),
      totalsStartX + correctTotalsWidth - 2,
      currentY + 3.5,
      { align: "right" }
    );
    currentY += 5;

    // Always show discount line
    pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
    pdf.text("DISCOUNT", totalsStartX + 2, currentY + 3.5);
    pdf.text(
      (invoice.discount || 0).toFixed(2),
      totalsStartX + correctTotalsWidth - 2,
      currentY + 3.5,
      { align: "right" }
    );
    currentY += 5;

    // Calculate subtotal after discount
    const subtotalAfterDiscount = invoice.subtotal - (invoice.discount || 0);
    
    // Show "SUBTOTAL LESS DISCOUNT" line
    pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
    pdf.text("SUBTOTAL LESS DISCOUNT", totalsStartX + 2, currentY + 3.5);
    pdf.text(
      subtotalAfterDiscount.toFixed(2),
      totalsStartX + correctTotalsWidth - 2,
      currentY + 3.5,
      { align: "right" }
    );
    currentY += 5;

    // VAT Rate line
    if (invoice.taxRate > 0) {
      pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
      pdf.text(
        "VAT RATE",
        totalsStartX + 2,
        currentY + 3.5
      );
      pdf.text(
        `${invoice.taxRate.toFixed(1)}%`,
        totalsStartX + correctTotalsWidth - 2,
        currentY + 3.5,
        { align: "right" }
      );
      currentY += 5;

      // Total VAT line
      pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
      pdf.text("TOTAL VAT", totalsStartX + 2, currentY + 3.5);
      pdf.text(
        invoice.taxAmount.toFixed(2),
        totalsStartX + correctTotalsWidth - 2,
        currentY + 3.5,
        { align: "right" }
      );
      currentY += 5;
    }

    // Shipping/Handling line
    if ((invoice.transportationCost || 0) > 0) {
      pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
      pdf.text("SHIPPING/HANDLING", totalsStartX + 2, currentY + 3.5);
      pdf.text(
        (invoice.transportationCost || 0).toFixed(2),
        totalsStartX + correctTotalsWidth - 2,
        currentY + 3.5,
        { align: "right" }
      );
      currentY += 5;
    }

    // Grand Total
    pdf.setFillColor(70, 130, 180);
    pdf.rect(totalsStartX, currentY, correctTotalsWidth, 6, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Invoice Total", totalsStartX + 2, currentY + 4);
    pdf.text(
      `BDT ${invoice.grandTotal.toFixed(2)}`,
      totalsStartX + correctTotalsWidth - 2,
      currentY + 4,
      { align: "right" }
    );

    currentY += 15;

    // Terms & Instructions - check if we need a new page before adding terms
    const termsText =
      invoice.termsAndInstructions ||
      "50% Advance with the Work order, the rest after delivery\nDelivery time: Supply 3-5 days After Getting the PO\nThe Price included 5% AIT & 10% VAT";

    const termsLines = termsText.split("\n");
    const termsHeight = 12 + (termsLines.length * 3) + 8; // Title + lines + spacing
    const footerHeight = 40; // Space needed for footer
    const requiredSpace = termsHeight + footerHeight;

    // Check if we need a new page for terms and footer
    if (currentY + requiredSpace > pageHeight) {
      pdf.addPage();
      currentY = margin;
    }

    // Terms & Instructions
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("Terms & Instructions", margin, currentY);
    currentY += 4;

    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");

    // Handle multi-line terms text
    termsLines.forEach((line, index) => {
      pdf.text(line, margin, currentY + index * 3);
    });
    currentY += termsLines.length * 3;
    currentY += 8;

    // Single footer section
    const footerY = Math.max(currentY + 10, pageHeight - 35);

    // Right side - Single authorization section
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text("Authorized by", pageWidth - 50, footerY);

    // Only show authorization details if they exist in settings
    if (
      settings?.quotation?.authorizedBy?.name &&
      settings?.quotation?.authorizedBy?.designation
    ) {
      const authorizedName = settings.quotation.authorizedBy.name;
      const authorizedDesignation =
        settings.quotation.authorizedBy.designation;

      // Add more space for signature (increased gap from +4 to +12)
      pdf.setFont("helvetica", "bold");
      pdf.text(authorizedName, pageWidth - 50, footerY + 12);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.text(authorizedDesignation, pageWidth - 50, footerY + 15);
    }

    // Bottom center - Thank you message
    pdf.setFontSize(6);
    pdf.text("Thank you for your business!", pageWidth / 2, footerY + 15, {
      align: "center",
    });

    // Save the PDF
    pdf.save(`${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
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
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h1>
          <p className="text-gray-600 mb-6">
            The invoice you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/invoices">
            <Button className="mt-4">Back to Invoices</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/invoices">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
            <p className="text-gray-600">
              Invoice for {invoice.client.companyName}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={generatePDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={() => setEditing(!editing)} variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            {editing ? "Cancel" : "Edit Status"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Invoice Number
                  </Label>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Quotation Number
                  </Label>
                  <p className="font-medium">{invoice.quotationNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Purchase Order
                  </Label>
                  <p className="font-medium">{invoice.purchaseOrderNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Due Date
                  </Label>
                  <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Created Date
                  </Label>
                  <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Status
                  </Label>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-gray-600">
                            {item.brand} {item.modelName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Terms */}
          {invoice.termsAndInstructions && (
            <Card>
              <CardHeader>
                <CardTitle>Terms & Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{invoice.termsAndInstructions}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          {editing && (
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {status === "paid" && (
                  <>
                    <div>
                      <Label htmlFor="paidAmount">Paid Amount</Label>
                      <Input
                        id="paidAmount"
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="Enter paid amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paidDate">Paid Date</Label>
                      <Input
                        id="paidDate"
                        type="date"
                        value={paidDate}
                        onChange={(e) => setPaidDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <Button onClick={handleStatusUpdate} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Update Status
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>{formatCurrency(invoice.discount)}</span>
              </div>
              {invoice.transportationCost > 0 && (
                <div className="flex justify-between">
                  <span>Transportation:</span>
                  <span>{formatCurrency(invoice.transportationCost)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax ({invoice.taxRate}%):</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(invoice.grandTotal)}</span>
              </div>
              {invoice.paidAmount && (
                <div className="flex justify-between text-green-600">
                  <span>Paid:</span>
                  <span>{formatCurrency(invoice.paidAmount)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="font-medium">{invoice.client.companyName}</p>
                  {invoice.client.address && (
                    <div className="text-sm text-gray-600">
                      <p>{invoice.client.address.street}</p>
                      <p>
                        {invoice.client.address.city}, {invoice.client.address.state}{" "}
                        {invoice.client.address.zipCode}
                      </p>
                      <p>{invoice.client.address.country}</p>
                    </div>
                  )}
                </div>
                {invoice.clientContact && (
                  <div className="pt-2 border-t">
                    <p className="font-medium">{invoice.clientContact.name}</p>
                    <p className="text-sm text-gray-600">{invoice.clientContact.title}</p>
                    <p className="text-sm text-gray-600">{invoice.clientContact.email}</p>
                    <p className="text-sm text-gray-600">{invoice.clientContact.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
