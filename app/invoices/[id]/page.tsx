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

  const generatePDF = () => {
    if (!invoice) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    let currentY = margin;

    // Header
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("INVOICE", pageWidth / 2, currentY, { align: "center" });
    currentY += 15;

    // Invoice details
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Invoice Number: ${invoice.invoiceNumber}`, margin, currentY);
    currentY += 7;
    pdf.text(`Quotation Number: ${invoice.quotationNumber}`, margin, currentY);
    currentY += 7;
    pdf.text(`Purchase Order: ${invoice.purchaseOrderNumber}`, margin, currentY);
    currentY += 7;
    pdf.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, margin, currentY);
    currentY += 7;
    pdf.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, margin, currentY);
    currentY += 15;

    // Client information
    pdf.setFont("helvetica", "bold");
    pdf.text("BILL TO:", margin, currentY);
    currentY += 7;
    pdf.setFont("helvetica", "normal");
    pdf.text(invoice.client.companyName, margin, currentY);
    currentY += 5;
    if (invoice.client.address) {
      pdf.text(invoice.client.address.street, margin, currentY);
      currentY += 5;
      pdf.text(`${invoice.client.address.city}, ${invoice.client.address.state} ${invoice.client.address.zipCode}`, margin, currentY);
      currentY += 5;
      pdf.text(invoice.client.address.country, margin, currentY);
      currentY += 10;
    }

    // Contact information
    if (invoice.clientContact) {
      pdf.text(`Contact: ${invoice.clientContact.name} (${invoice.clientContact.title})`, margin, currentY);
      currentY += 5;
      pdf.text(`Email: ${invoice.clientContact.email}`, margin, currentY);
      currentY += 5;
      pdf.text(`Phone: ${invoice.clientContact.phone}`, margin, currentY);
      currentY += 15;
    }

    // Items table header
    const tableStartY = currentY;
    const colWidths = [80, 25, 20, 30, 30];
    const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], 
                         margin + colWidths[0] + colWidths[1] + colWidths[2], 
                         margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]];

    pdf.setFont("helvetica", "bold");
    pdf.rect(margin, currentY, pageWidth - 2 * margin, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.text("DESCRIPTION", colPositions[0] + 2, currentY + 5.5);
    pdf.text("QTY", colPositions[1] + 2, currentY + 5.5);
    pdf.text("UNIT", colPositions[2] + 2, currentY + 5.5);
    pdf.text("PRICE", colPositions[3] + 2, currentY + 5.5);
    pdf.text("TOTAL", colPositions[4] + 2, currentY + 5.5);
    currentY += 8;

    // Items
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    invoice.items.forEach((item) => {
      const description = `${item.productName}\n${item.brand} ${item.modelName}`;
      const lines = pdf.splitTextToSize(description, colWidths[0] - 4);
      const lineHeight = 5;
      const itemHeight = Math.max(8, lines.length * lineHeight);

      pdf.rect(margin, currentY, pageWidth - 2 * margin, itemHeight);
      
      pdf.text(lines, colPositions[0] + 2, currentY + 4);
      pdf.text(item.quantity.toString(), colPositions[1] + 2, currentY + 4);
      pdf.text(item.unit, colPositions[2] + 2, currentY + 4);
      pdf.text(item.sellingPrice.toFixed(0), colPositions[3] + 2, currentY + 4);
      pdf.text(item.lineTotal.toFixed(0), colPositions[4] + 2, currentY + 4);
      
      currentY += itemHeight;
    });

    // Totals section
    currentY += 10;
    const totalsStartX = pageWidth - 80;
    const correctTotalsWidth = 60;

    // Subtotal
    pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
    pdf.setFont("helvetica", "bold");
    pdf.text("SUBTOTAL", totalsStartX + 2, currentY + 3.5);
    pdf.text(
      invoice.subtotal.toFixed(0),
      totalsStartX + correctTotalsWidth - 2,
      currentY + 3.5,
      { align: "right" }
    );
    currentY += 5;

    // Discount
    pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
    pdf.text("DISCOUNT", totalsStartX + 2, currentY + 3.5);
    pdf.text(
      (invoice.discount || 0).toFixed(2),
      totalsStartX + correctTotalsWidth - 2,
      currentY + 3.5,
      { align: "right" }
    );
    currentY += 5;

    // Subtotal less discount
    const subtotalAfterDiscount = invoice.subtotal - (invoice.discount || 0);
    pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
    pdf.text("SUBTOTAL LESS DISCOUNT", totalsStartX + 2, currentY + 3.5);
    pdf.text(
      subtotalAfterDiscount.toFixed(2),
      totalsStartX + correctTotalsWidth - 2,
      currentY + 3.5,
      { align: "right" }
    );
    currentY += 5;

    // VAT Rate
    if (invoice.taxRate > 0) {
      pdf.rect(totalsStartX, currentY, correctTotalsWidth, 5);
      pdf.text("VAT RATE", totalsStartX + 2, currentY + 3.5);
      pdf.text(
        `${invoice.taxRate.toFixed(1)}%`,
        totalsStartX + correctTotalsWidth - 2,
        currentY + 3.5,
        { align: "right" }
      );
      currentY += 5;

      // Total VAT
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

    // Transportation cost
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
    pdf.setFont("helvetica", "bold");
    pdf.text("Invoice Total", totalsStartX + 2, currentY + 4);
    pdf.text(
      `BDT ${invoice.grandTotal.toFixed(2)}`,
      totalsStartX + correctTotalsWidth - 2,
      currentY + 4,
      { align: "right" }
    );
    currentY += 10;

    // Terms and Instructions
    if (invoice.termsAndInstructions) {
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text("Terms & Instructions", margin, currentY);
      currentY += 7;
      pdf.setFont("helvetica", "normal");
      const termsLines = pdf.splitTextToSize(invoice.termsAndInstructions, pageWidth - 2 * margin);
      pdf.text(termsLines, margin, currentY);
    }

    // Save PDF
    pdf.save(`${invoice.invoiceNumber}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `BDT ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Invoice not found</p>
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
