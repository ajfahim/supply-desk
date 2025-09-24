"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Edit,
  Package,
  Truck,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ChalanItem {
  _id?: string;
  productName: string;
  product: string;
  specifications?: {
    [key: string]: string | number | boolean;
  };
  quantity: number;
  unit: string;
  deliveryTime?: string;
  warranty?: string;
}

interface Chalan {
  _id: string;
  chalanNumber: string;
  invoice?: string; // Add invoice field
  invoiceNumber?: string; // Add invoice number field
  client: {
    _id: string;
    companyName: string;
    address: string;
    phone: string;
    email: string;
  };
  clientContact: {
    _id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  items: ChalanItem[];
  deliveryAddress: string;
  deliveryDate: string;
  transportationDetails?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  receivedBy?: {
    name: string;
    designation: string;
    signature?: string;
    receivedDate?: string;
  };
  status: "draft" | "dispatched" | "delivered" | "received";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChalanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const chalanId = params.id as string;

  const [chalan, setChalan] = useState<Chalan | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Received by form state
  const [receivedByName, setReceivedByName] = useState("");
  const [receivedByDesignation, setReceivedByDesignation] = useState("");
  const [showReceivedForm, setShowReceivedForm] = useState(false);

  useEffect(() => {
    fetchChalanAndSettings();
  }, [chalanId]);

  const fetchChalanAndSettings = async () => {
    try {
      const [chalanRes, settingsRes] = await Promise.all([
        fetch(`/api/chalans/${chalanId}`),
        fetch("/api/settings"),
      ]);

      const chalanData = await chalanRes.json();
      const settingsData = await settingsRes.json();

      // Populate invoice number if invoice reference exists
      if (chalanData.invoice) {
        try {
          const invoiceRes = await fetch(`/api/invoices/${chalanData.invoice}`);
          const invoiceData = await invoiceRes.json();
          chalanData.invoiceNumber = invoiceData.invoiceNumber;
        } catch (error) {
          console.error("Error fetching invoice:", error);
        }
      }

      console.log("Chalan data:", chalanData);
      console.log("Driver phone:", chalanData.driverPhone);

      // Add driverPhone field if missing for existing chalans
      if (!chalanData.driverPhone && chalanData.driverName) {
        chalanData.driverPhone = ""; // Default test phone number
      }
      setChalan(chalanData);
      setSettings(settingsData);

      if (chalanData.receivedBy) {
        setReceivedByName(chalanData.receivedBy.name || "");
        setReceivedByDesignation(chalanData.receivedBy.designation || "");
      }
    } catch (error) {
      console.error("Error fetching chalan:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!chalan) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/chalans/${chalanId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedChalan = await response.json();
        setChalan(updatedChalan);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const markAsReceived = async () => {
    if (!chalan || !receivedByName || !receivedByDesignation) {
      alert("Please fill in receiver details");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/chalans/${chalanId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "received",
          receivedBy: {
            name: receivedByName,
            designation: receivedByDesignation,
            receivedDate: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const updatedChalan = await response.json();
        setChalan(updatedChalan);
        setShowReceivedForm(false);
      }
    } catch (error) {
      console.error("Error marking as received:", error);
    } finally {
      setUpdating(false);
    }
  };

  const generatePDF = async () => {
    if (!chalan || !settings) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;

    // Helper function to add text with word wrapping and page break
    const addText = (text: string, x: number, y: number, maxWidth?: number) => {
      if (y > pageHeight - 30) {
        pdf.addPage();
        y = margin;
      }

      if (maxWidth) {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + lines.length * 4;
      } else {
        pdf.text(text, x, y);
        return y + 4;
      }
    };

    // Company logo at the top left
    if (settings.company?.logo) {
      try {
        // Convert logo to base64 if it's not already
        const logoData = settings.company.logo.startsWith("data:")
          ? settings.company.logo
          : `data:image/png;base64,${settings.company.logo}`;
        pdf.addImage(logoData, "PNG", margin, currentY, 35, 0);
      } catch (error) {
        console.error("Error adding logo:", error);
      }
    }

    // Company info at the top right
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");

    const companyInfo: string[] = [];
    if (settings?.company?.address) {
      const address =
        typeof settings.company.address === "string"
          ? settings.company.address
          : `${(settings.company.address as any)?.street || ""}, ${
              (settings.company.address as any)?.city || ""
            }, ${(settings.company.address as any)?.country || ""}`
              .replace(/^,\s*|,\s*$/g, "")
              .replace(/,\s*,/g, ",");
      companyInfo.push(address);
    }
    if (settings?.company?.contact?.email) {
      companyInfo.push(`Email: ${settings.company.contact.email}`);
    }
    if (settings?.company?.contact?.phone) {
      companyInfo.push(`Phone: ${settings.company.contact.phone}`);
    }
    if (settings?.company?.bin) {
      companyInfo.push(`BIN: ${settings.company.bin}`);
    }
    if (settings?.company?.contact?.website) {
      companyInfo.push(settings.company.contact.website);
    }

    let infoY = currentY;
    companyInfo.forEach((line) => {
      pdf.text(line, pageWidth - margin, infoY, { align: "right" });
      infoY += 3;
    });

    // Company name below logo
    currentY += 35;
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    if (settings.company?.name) {
      pdf.text(settings.company.name, margin, currentY);
      currentY += 8;
    }

    currentY += 5;

    // Delivery Note title with border (matching invoice style)
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, currentY, contentWidth, 8, "F");
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(margin, currentY, contentWidth, 8);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("DELIVERY NOTE", pageWidth / 2, currentY + 5.5, {
      align: "center",
    });
    currentY += 18;

    // Two column layout for chalan details
    const leftColX = margin;
    const rightColX = pageWidth - margin - 60;

    // Chalan details section (moved above TO and DELIVERY ADDRESS)
    const detailsStartY = currentY;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Chalan No:", leftColX, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(chalan.chalanNumber || "N/A", leftColX + 25, currentY);
    currentY += 5;

    // Add invoice number after Chalan No
    pdf.setFont("helvetica", "bold");
    pdf.text("Invoice No:", leftColX, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(chalan.invoiceNumber || "N/A", leftColX + 25, currentY);

    // Date section on the right
    let dateY = detailsStartY;
    pdf.setFont("helvetica", "bold");
    pdf.text("Date:", rightColX, dateY);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      new Date(chalan.createdAt).toLocaleDateString(),
      rightColX + 15,
      dateY
    );
    dateY += 5;

    pdf.setFont("helvetica", "bold");
    pdf.text("Delivery Date:", rightColX, dateY);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      chalan.deliveryDate
        ? new Date(chalan.deliveryDate).toLocaleDateString()
        : "N/A",
      rightColX + 30,
      dateY
    );

    currentY += 15;

    // Transportation details section (moved from bottom)
    if (
      chalan.transportationDetails ||
      chalan.driverName ||
      chalan.driverPhone ||
      chalan.vehicleNumber
    ) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("TRANSPORTATION DETAILS:", leftColX, currentY);
      currentY += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);

      if (chalan.transportationDetails) {
        pdf.text(`Method: ${chalan.transportationDetails}`, leftColX, currentY);
        currentY += 5;
      }
      if (chalan.driverName) {
        pdf.text(`Driver: ${chalan.driverName}`, leftColX, currentY);
        currentY += 5;
      }
      if (chalan.driverPhone) {
        pdf.text(`Driver Phone: ${chalan.driverPhone}`, leftColX, currentY);
        currentY += 5;
      }
      if (chalan.vehicleNumber) {
        pdf.text(`Vehicle: ${chalan.vehicleNumber}`, leftColX, currentY);
        currentY += 5;
      }
    }

    // DELIVERY ADDRESS section (on the right)
    let deliveryY = currentY - 25;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("DELIVERY ADDRESS:", rightColX, deliveryY);
    deliveryY += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const deliveryLines = pdf.splitTextToSize(chalan.deliveryAddress, 60);
    deliveryLines.forEach((line: string) => {
      pdf.text(line, rightColX, deliveryY);
      deliveryY += 4;
    });

    currentY += 15;

    // Items table header (without pricing columns)
    const colWidths = [15, 110, 20, 25, 30];
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
    pdf.text("REMARKS", colPositions[4] + 2, currentY + 5.5);

    currentY += 8;

    // Items with simple product names only
    pdf.setTextColor(0, 0, 0);
    chalan.items.forEach((item, index) => {
      // Simple description - only product name
      const description = item.productName || "N/A";

      const descLines = pdf.splitTextToSize(description, colWidths[1] - 4);
      const rowHeight = Math.max(8, descLines.length * 3 + 2);

      // Check for page break
      if (currentY + rowHeight > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;

        // Redraw header on new page
        pdf.setFillColor(70, 130, 180);
        pdf.rect(margin, currentY, contentWidth, 8, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);

        pdf.text("SL", colPositions[0] + 2, currentY + 5.5);
        pdf.text("DESCRIPTION OF GOODS", colPositions[1] + 2, currentY + 5.5);
        pdf.text("QTY", colPositions[2] + 2, currentY + 5.5);
        pdf.text("UNIT", colPositions[3] + 2, currentY + 5.5);
        pdf.text("REMARKS", colPositions[4] + 2, currentY + 5.5);

        currentY += 8;
        pdf.setTextColor(0, 0, 0);
      }

      // Draw row border
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, currentY, contentWidth, rowHeight);

      // Row content
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      // Serial number
      pdf.text((index + 1).toString(), colPositions[0] + 2, currentY + 4);

      // Description
      pdf.text(descLines, colPositions[1] + 2, currentY + 4);

      // Quantity
      pdf.text(item.quantity.toString(), colPositions[2] + 2, currentY + 4);

      // Unit
      pdf.text(item.unit || "N/A", colPositions[3] + 2, currentY + 4);

      // Remarks
      const remarksText = item.warranty ? `Warranty: ${item.warranty}` : "";
      if (remarksText) {
        const remarksLines = pdf.splitTextToSize(remarksText, colWidths[4] - 4);
        pdf.text(remarksLines, colPositions[4] + 2, currentY + 4);
      }

      currentY += rowHeight;
    });

    currentY += 15;

    // Transportation details section has been moved above (removed duplicate)

    // Check if we need a new page for signature section
    if (currentY + 60 > pageHeight - 40) {
      pdf.addPage();
      currentY = margin;
    }

    // Signature section (matching invoice style)
    const signatureY = Math.max(currentY + 20, pageHeight - 50);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("RECEIVED BY:", margin, signatureY);
    pdf.text("AUTHORIZED SIGNATURE:", pageWidth - margin - 80, signatureY);

    // Signature lines
    pdf.setDrawColor(0, 0, 0);
    pdf.line(margin, signatureY + 15, margin + 70, signatureY + 15);
    pdf.line(
      pageWidth - margin - 80,
      signatureY + 15,
      pageWidth - margin,
      signatureY + 15
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Name, Signature & Date", margin, signatureY + 20);
    pdf.text(
      "Company Seal & Signature",
      pageWidth - margin - 80,
      signatureY + 20
    );

    pdf.save(`${chalan.chalanNumber}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "dispatched":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-yellow-100 text-yellow-800";
      case "received":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading delivery note...</div>
        </div>
      </div>
    );
  }

  if (!chalan) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Delivery note not found
          </h1>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Note</h1>
            <p className="text-gray-600 mt-1">#{chalan.chalanNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(chalan.status)}>
            {chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}
          </Badge>
          <Button variant="outline" onClick={generatePDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={() => router.push(`/chalans/${chalanId}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Company</h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">
                      {chalan.client.companyName}
                    </div>
                    {chalan.client.address && (
                      <div className="text-gray-600">
                        {typeof chalan.client.address === "string"
                          ? chalan.client.address
                          : `${(chalan.client.address as any)?.street || ""}, ${
                              (chalan.client.address as any)?.city || ""
                            }, ${(chalan.client.address as any)?.country || ""}`
                              .replace(/^,\s*|,\s*$/g, "")
                              .replace(/,\s*,/g, ",")}
                      </div>
                    )}
                    {chalan.client.phone && (
                      <div className="text-gray-600">
                        Phone: {chalan.client.phone}
                      </div>
                    )}
                    {chalan.client.email && (
                      <div className="text-gray-600">
                        Email: {chalan.client.email}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Contact Person</h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">
                      {chalan.clientContact.name}
                    </div>
                    <div className="text-gray-600">
                      {chalan.clientContact.title}
                    </div>
                    {chalan.clientContact.phone && (
                      <div className="text-gray-600">
                        Phone: {chalan.clientContact.phone}
                      </div>
                    )}
                    {chalan.clientContact.email && (
                      <div className="text-gray-600">
                        Email: {chalan.clientContact.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Delivery Address</h4>
                  <div className="text-sm text-gray-600 whitespace-pre-line">
                    {chalan.deliveryAddress}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Delivery Details</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Date:</span>{" "}
                      {formatDate(chalan.deliveryDate)}
                    </div>
                    {chalan.driverName && (
                      <div>
                        <span className="font-medium">Driver:</span>{" "}
                        {chalan.driverName}
                      </div>
                    )}
                    {chalan.driverPhone && (
                      <div>
                        <span className="font-medium">Driver Phone:</span>{" "}
                        {chalan.driverPhone}
                      </div>
                    )}
                    {chalan.vehicleNumber && (
                      <div>
                        <span className="font-medium">Vehicle:</span>{" "}
                        {chalan.vehicleNumber}
                      </div>
                    )}
                    {chalan.transportationDetails && (
                      <div>
                        <span className="font-medium">Details:</span>{" "}
                        {chalan.transportationDetails}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chalan.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <span className="font-medium">
                            {item.productName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Received By Section */}
          {chalan.status === "delivered" && !chalan.receivedBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Mark as Received
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showReceivedForm ? (
                  <Button onClick={() => setShowReceivedForm(true)}>
                    Mark as Received
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="receivedByName">Receiver Name *</Label>
                        <Input
                          id="receivedByName"
                          value={receivedByName}
                          onChange={(e) => setReceivedByName(e.target.value)}
                          placeholder="Enter receiver's name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="receivedByDesignation">
                          Designation *
                        </Label>
                        <Input
                          id="receivedByDesignation"
                          value={receivedByDesignation}
                          onChange={(e) =>
                            setReceivedByDesignation(e.target.value)
                          }
                          placeholder="Enter receiver's designation"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={markAsReceived}
                        disabled={
                          updating || !receivedByName || !receivedByDesignation
                        }
                      >
                        {updating ? "Updating..." : "Confirm Receipt"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowReceivedForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Received By Information */}
          {chalan.receivedBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Received By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {chalan.receivedBy.name}
                  </div>
                  <div>
                    <span className="font-medium">Designation:</span>{" "}
                    {chalan.receivedBy.designation}
                  </div>
                  {chalan.receivedBy.receivedDate && (
                    <div>
                      <span className="font-medium">Date:</span>{" "}
                      {formatDate(chalan.receivedBy.receivedDate)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span className="font-medium">{chalan.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Quantity:</span>
                  <span className="font-medium">
                    {chalan.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-medium">
                    {formatDate(chalan.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Date:</span>
                  <span className="font-medium">
                    {formatDate(chalan.deliveryDate)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Status Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {chalan.status === "draft" && (
                <Button
                  onClick={() => updateStatus("dispatched")}
                  disabled={updating}
                  className="w-full"
                >
                  Mark as Dispatched
                </Button>
              )}
              {chalan.status === "dispatched" && (
                <Button
                  onClick={() => updateStatus("delivered")}
                  disabled={updating}
                  className="w-full"
                >
                  Mark as Delivered
                </Button>
              )}
              {chalan.status === "delivered" && !chalan.receivedBy && (
                <div className="text-sm text-gray-600">
                  Waiting for receiver confirmation
                </div>
              )}
              {chalan.status === "received" && (
                <div className="text-sm text-green-600 font-medium">
                  ✓ Delivery completed
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
