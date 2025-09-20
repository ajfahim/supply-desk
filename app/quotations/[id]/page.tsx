"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { jsPDF } from "jspdf";
import { ArrowLeft, Download, Edit, Send, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
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
  transportationCost?: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  status: string;
  validUntil: string;
  deliveryTerms: string;
  paymentTerms: string;
  warranty: string;
  termsAndInstructions: string;
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
  const [error, setError] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const quotationId = params.id as string;

  useEffect(() => {
    fetchQuotation();
    fetchSettings();
  }, [quotationId]);

  const fetchQuotation = async () => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch quotation");
      }
      const data = await response.json();
      setQuotation(data);
    } catch (err) {
      setError("Failed to load quotation");
      console.error("Error fetching quotation:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDownloadPDF = async () => {
    if (!quotation) return;

    setIsGeneratingPDF(true);
    try {
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

      // Quotation title with border
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, currentY, contentWidth, 8, "F");
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(margin, currentY, contentWidth, 8);

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("COMMERCIAL QUOTATION", pageWidth / 2, currentY + 5.5, {
        align: "center",
      });
      currentY += 18; // Added more spacing below

      // Two column layout for TO and SHIP TO
      const leftColX = margin;
      const shipToContentX = pageWidth - margin - 60; // Move to far right

      // TO section
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("TO", leftColX, currentY);

      // SHIP TO section (far right)
      pdf.text("SHIP TO", shipToContentX, currentY);
      currentY += 4;

      // TO content
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      let toY = currentY;

      // Contact person name (first line)
      if (quotation.clientContact.name) {
        pdf.text(quotation.clientContact.name, leftColX, toY);
        toY += 3.5;
      }

      // Contact person designation (second line)
      if (quotation.clientContact.title) {
        pdf.text(quotation.clientContact.title, leftColX, toY);
        toY += 3.5;
      }

      // Company name (third line, in bold)
      pdf.setFont("helvetica", "bold");
      pdf.text(quotation.client.companyName, leftColX, toY);
      toY += 3.5;
      pdf.setFont("helvetica", "normal");

      // Client address (fourth line onwards)
      if (quotation.client.address) {
        const addressLines = [];

        // Build address string
        if (quotation.client.address.street) {
          addressLines.push(quotation.client.address.street);
        }

        // City, state, zipCode, country on separate lines or combined
        const locationParts = [];
        if (quotation.client.address.city)
          locationParts.push(quotation.client.address.city);
        if (quotation.client.address.zipCode)
          locationParts.push(quotation.client.address.zipCode);
        if (quotation.client.address.country)
          locationParts.push(quotation.client.address.country);

        if (locationParts.length > 0) {
          addressLines.push(locationParts.join(", "));
        }

        // Print each address line
        addressLines.forEach((line) => {
          if (line.trim()) {
            pdf.text(line, leftColX, toY);
            toY += 3.5;
          }
        });
      }

      // SHIP TO content
      let shipToY = currentY;
      pdf.text(quotation.client.companyName, shipToContentX, shipToY);
      shipToY += 3.5;
      pdf.text(quotation.client.industry, shipToContentX, shipToY);

      // Quote details (far right side)
      shipToY += 8;
      pdf.text(
        `Quote Date: ${formatDate(quotation.createdAt)}`,
        shipToContentX,
        shipToY
      );
      shipToY += 3.5;
      pdf.text(`Valid For: 15 days`, shipToContentX, shipToY);
      shipToY += 3.5;
      pdf.text(`Ref: ${quotation.quotationNumber}`, shipToContentX, shipToY);

      currentY = Math.max(toY, shipToY) + 8;

      // Items table (removed Size column)
      const tableStartY = currentY;
      const colWidths = [12, 85, 15, 20, 28, 28];
      const colPositions = [margin];
      for (let i = 1; i < colWidths.length; i++) {
        colPositions.push(colPositions[i - 1] + colWidths[i - 1]);
      }

      // Table header
      pdf.setFillColor(70, 130, 180); // Steel blue
      pdf.rect(margin, currentY, contentWidth, 10, "F");
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(margin, currentY, contentWidth, 10);

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");

      const headers = [
        "SL",
        "Item",
        "Unit",
        "Quantity",
        "Unit Price\n(Supply)",
        "Total Price\n(Supply)",
      ];
      headers.forEach((header, i) => {
        const x = colPositions[i] + colWidths[i] / 2;

        // Handle multi-line headers
        if (header.includes("\n")) {
          const lines = header.split("\n");
          pdf.text(lines[0], x, currentY + 3.5, { align: "center" });
          pdf.text(lines[1], x, currentY + 6.5, { align: "center" });
        } else {
          pdf.text(header, x, currentY + 5, { align: "center" });
        }

        // Draw column borders
        if (i > 0) {
          pdf.setDrawColor(255, 255, 255);
          pdf.line(colPositions[i], currentY, colPositions[i], currentY + 10);
        }
      });

      currentY += 10;

      // Table rows
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");

      quotation.items.forEach((item, index) => {
        if (currentY > pageHeight - 60) {
          pdf.addPage();
          currentY = margin;
        }

        // Item (with all specifications consolidated)
        const itemText = String(item.product.name || "");
        const brandText = String(item.product.brand || "");
        const modelText = String(item.product.modelName || "");

        // Handle specifications - format with keys and values
        const specsLines: string[] = [];
        const specs = (item.product as any).specifications;
        if (specs && typeof specs === "object") {
          Object.entries(specs).forEach(([key, value]) => {
            if (value) {
              let formattedValue = value;
              // Handle arrays (like certification)
              if (Array.isArray(value)) {
                formattedValue = value.join(", ");
              }
              specsLines.push(`${key}: ${formattedValue}`);
            }
          });
        }

        // Build comprehensive item description
        let fullSpecs = "";
        if (brandText) fullSpecs += `${brandText} `;
        if (modelText) fullSpecs += `${modelText}`;

        // Calculate dynamic row height based on content
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

        // Draw borders
        pdf.setDrawColor(200, 200, 200);
        for (let i = 0; i <= colWidths.length; i++) {
          const x =
            i === colWidths.length ? margin + contentWidth : colPositions[i];
          pdf.line(x, currentY, x, currentY + rowHeight);
        }
        pdf.line(margin, currentY, margin + contentWidth, currentY);
        pdf.line(
          margin,
          currentY + rowHeight,
          margin + contentWidth,
          currentY + rowHeight
        );

        // Row content
        pdf.setFontSize(7);

        // SL
        pdf.text(
          (index + 1).toString(),
          colPositions[0] + colWidths[0] / 2,
          currentY + rowHeight / 2,
          { align: "center" }
        );

        pdf.setFont("helvetica", "bold");
        pdf.text(itemText, colPositions[1] + 1, currentY + 3);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6);

        let specY = currentY + 7;
        if (fullSpecs.trim()) {
          pdf.text(fullSpecs.trim(), colPositions[1] + 1, specY);
          specY += 3;
        }

        // Display ALL specifications with keys
        if (specsLines.length > 0) {
          for (let i = 0; i < specsLines.length; i++) {
            pdf.text(specsLines[i], colPositions[1] + 1, specY);
            specY += 3;
          }
        }

        pdf.setFontSize(7);

        // Unit (moved to position 2 after removing Size)
        pdf.text(
          "PC",
          colPositions[2] + colWidths[2] / 2,
          currentY + rowHeight / 2,
          { align: "center" }
        );

        // Quantity (now position 3)
        pdf.text(
          item.quantity.toString(),
          colPositions[3] + colWidths[3] / 2,
          currentY + rowHeight / 2,
          { align: "center" }
        );

        // Unit Price (now position 4)
        const unitPrice = item.sellingPrice.toFixed(0);
        pdf.text(
          unitPrice,
          colPositions[4] + colWidths[4] / 2,
          currentY + rowHeight / 2,
          { align: "center" }
        );

        // Total Price (now position 5)
        pdf.setFont("helvetica", "bold");
        const totalPrice = item.lineTotal.toFixed(0);
        pdf.text(
          totalPrice,
          colPositions[5] + colWidths[5] / 2,
          currentY + rowHeight / 2,
          { align: "center" }
        );

        currentY += rowHeight;
      });

      // Table footer with totals - align with table end
      currentY += 2;
      const totalsStartX = colPositions[3]; // Start from Quantity column (position 3)
      const totalsWidth = colWidths[3] + colWidths[4] + colWidths[5]; // Span last 3 columns
      const tableEndX = margin + contentWidth; // Actual table end position
      const correctTotalsWidth = tableEndX - totalsStartX; // Calculate correct width

      // Subtotal
      pdf.setFillColor(240, 240, 240);
      pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5, "F");
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("SUBTOTAL", totalsStartX + 2, currentY + 3.5);
      pdf.text(
        quotation.subtotal.toFixed(0),
        totalsStartX + correctTotalsWidth - 2,
        currentY + 3.5,
        { align: "right" }
      );
      currentY += 5;

      // Always show discount line
      pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
      pdf.text("DISCOUNT", totalsStartX + 2, currentY + 3.5);
      pdf.text(
        (quotation.discount || 0).toFixed(2),
        totalsStartX + correctTotalsWidth - 2,
        currentY + 3.5,
        { align: "right" }
      );
      currentY += 5;

      // Calculate subtotal after discount
      const subtotalAfterDiscount = quotation.subtotal - (quotation.discount || 0);
      
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
      if (quotation.taxRate > 0) {
        pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
        pdf.text(
          "VAT RATE",
          totalsStartX + 2,
          currentY + 3.5
        );
        pdf.text(
          `${quotation.taxRate.toFixed(1)}%`,
          totalsStartX + correctTotalsWidth - 2,
          currentY + 3.5,
          { align: "right" }
        );
        currentY += 5;

        // Total VAT line
        pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
        pdf.text("TOTAL VAT", totalsStartX + 2, currentY + 3.5);
        pdf.text(
          quotation.taxAmount.toFixed(2),
          totalsStartX + correctTotalsWidth - 2,
          currentY + 3.5,
          { align: "right" }
        );
        currentY += 5;
      }

      // Shipping/Handling line
      if ((quotation.transportationCost || 0) > 0) {
        pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
        pdf.text("SHIPPING/HANDLING", totalsStartX + 2, currentY + 3.5);
        pdf.text(
          (quotation.transportationCost || 0).toFixed(2),
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
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Quote Total", totalsStartX + 2, currentY + 4);
      pdf.text(
        `BDT ${quotation.grandTotal.toFixed(2)}`,
        totalsStartX + correctTotalsWidth - 2,
        currentY + 4,
        { align: "right" }
      );

      currentY += 15;

      // Terms & Instructions
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("Terms & Instructions", margin, currentY);
      currentY += 4;

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      const termsText =
        quotation.termsAndInstructions ||
        "50% Advance with the Work order, the rest after delivery\nDelivery time: Supply 3-5 days After Getting the PO\nThe Price included 5% AIT & 10% VAT";

      // Handle multi-line terms text
      const termsLines = termsText.split("\n");
      termsLines.forEach((line, index) => {
        pdf.text(line, margin, currentY + index * 3);
      });
      currentY += termsLines.length * 3;
      currentY += 8;

      // Footer - check if we need a new page
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;
      }

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
      pdf.save(`${quotation.quotationNumber}.pdf`);
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quotation Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "The requested quotation could not be found."}
            </p>
            <Button
              onClick={() => router.push("/quotations")}
              variant="outline"
            >
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
          <Button variant="outline" onClick={() => router.push("/quotations")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(quotation.status)}>
              {quotation.status.toUpperCase()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/quotations/${quotationId}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? "Generating..." : "PDF"}
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
                  <h3 className="font-semibold text-lg">
                    {quotation.client.companyName}
                  </h3>
                  <p className="text-gray-600">{quotation.client.industry}</p>
                </div>
                <div>
                  <h4 className="font-medium">Contact Person</h4>
                  <p className="text-sm">{quotation.clientContact.name}</p>
                  <p className="text-sm text-gray-600">
                    {quotation.clientContact.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {quotation.clientContact.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    {quotation.clientContact.phone}
                  </p>
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
                              Vendor:{" "}
                              {item.selectedVendor?.companyName || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="text-center py-3">{item.quantity}</td>
                        <td className="text-right py-3">
                          {formatCurrency(item.sellingPrice)}
                        </td>
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
                      Discount (
                      {quotation.discountType === "percentage"
                        ? `${quotation.discount}%`
                        : "Fixed"}
                      ):
                    </span>
                    <span>-{formatCurrency(quotation.discount)}</span>
                  </div>
                )}
                {quotation.transportationCost &&
                  quotation.transportationCost > 0 && (
                    <div className="flex justify-between">
                      <span>Transportation Cost:</span>
                      <span>
                        {formatCurrency(quotation.transportationCost)}
                      </span>
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
                  <p className="text-sm text-gray-600">
                    {quotation.deliveryTerms}
                  </p>
                </div>
              )}
              {quotation.paymentTerms && (
                <div>
                  <h4 className="font-medium mb-1">Payment Terms</h4>
                  <p className="text-sm text-gray-600">
                    {quotation.paymentTerms}
                  </p>
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
                <p className="text-sm text-gray-600">
                  {formatDate(quotation.validUntil)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Last Updated</label>
                <p className="text-sm text-gray-600">
                  {formatDate(quotation.updatedAt)}
                </p>
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
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push(`/quotations/${quotationId}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Quotation
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
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
