"use client";

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
import { ArrowLeft, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Quotation {
  _id: string;
  quotationNumber: string;
  client: {
    _id: string;
    companyName: string;
  };
  grandTotal: number;
  status: string;
  createdAt: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<string>("");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuotations();
    // Set default due date to 30 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/quotations?limit=100");
      const data = await response.json();

      if (response.ok) {
        // Filter quotations that could be converted to invoices
        const availableQuotations = data.quotations.filter(
          (q: Quotation) => q.status !== "cancelled"
        );
        setQuotations(availableQuotations);
      } else {
        console.error("Failed to fetch quotations:", data.error);
      }
    } catch (error) {
      console.error("Error fetching quotations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedQuotation || !purchaseOrderNumber || !dueDate) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quotationId: selectedQuotation,
          purchaseOrderNumber,
          dueDate,
          createdBy: "System User", // You can replace this with actual user
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/invoices/${data._id}`);
      } else {
        alert(`Failed to create invoice: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("An error occurred while creating the invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedQuotationData = quotations.find(q => q._id === selectedQuotation);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Link href="/invoices">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Invoice</h1>
          <p className="text-gray-600">Generate an invoice from an approved quotation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="quotation">Select Quotation *</Label>
                  <Select
                    value={selectedQuotation}
                    onValueChange={setSelectedQuotation}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading quotations..." : "Choose a quotation"} />
                    </SelectTrigger>
                    <SelectContent>
                      {quotations.map((quotation) => (
                        <SelectItem key={quotation._id} value={quotation._id}>
                          {quotation.quotationNumber} - {quotation.client.companyName} (BDT {quotation.grandTotal.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {quotations.length === 0 && !loading && (
                    <p className="text-sm text-gray-500 mt-1">
                      No quotations available. <Link href="/quotations/new" className="text-blue-600 hover:underline">Create a quotation first</Link>
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="purchaseOrderNumber">Purchase Order Number *</Label>
                  <Input
                    id="purchaseOrderNumber"
                    value={purchaseOrderNumber}
                    onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                    placeholder="Enter PO number from client"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    The purchase order number provided by your client
                  </p>
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    When payment is due for this invoice
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={submitting || !selectedQuotation || !purchaseOrderNumber || !dueDate}
                    className="flex-1"
                  >
                    {submitting ? "Creating Invoice..." : "Create Invoice"}
                  </Button>
                  <Link href="/invoices">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedQuotationData ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-600">QUOTATION</h4>
                    <p className="font-medium">{selectedQuotationData.quotationNumber}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-600">CLIENT</h4>
                    <p className="font-medium">{selectedQuotationData.client.companyName}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-600">AMOUNT</h4>
                    <p className="font-medium text-lg">BDT {selectedQuotationData.grandTotal.toLocaleString()}</p>
                  </div>

                  {purchaseOrderNumber && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600">PO NUMBER</h4>
                      <p className="font-medium">{purchaseOrderNumber}</p>
                    </div>
                  )}

                  {dueDate && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600">DUE DATE</h4>
                      <p className="font-medium">{new Date(dueDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      The invoice will include all items, pricing, and terms from the selected quotation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Select a quotation to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
