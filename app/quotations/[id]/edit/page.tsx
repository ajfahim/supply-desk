'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

interface QuotationItem {
  product: string;
  productName: string;
  brand: string;
  modelName: string;
  specifications: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  vendorCost: number;
  profitMargin: number;
  vendorName?: string;
  deliveryTime?: string;
  warranty?: string;
  notes?: string;
}

interface Quotation {
  _id: string;
  quotationNumber: string;
  client: {
    _id: string;
    companyName: string;
    contacts: any[];
  };
  clientContact: {
    _id: string;
    name: string;
    email: string;
    title: string;
    phone: string;
  };
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxRate: number;
  validUntil: string;
  paymentTerms: string;
  deliveryTerms: string;
  warranty: string;
  notes: string;
  status: string;
}

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [validUntil, setValidUntil] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [warranty, setWarranty] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    fetchQuotationAndClients();
  }, [quotationId]);

  const fetchQuotationAndClients = async () => {
    try {
      const [quotationRes, clientsRes] = await Promise.all([
        fetch(`/api/quotations/${quotationId}`),
        fetch('/api/clients')
      ]);

      const quotationData = await quotationRes.json();
      const clientsData = await clientsRes.json();

      setQuotation(quotationData);
      setClients(clientsData || []);

      // Pre-populate form
      setSelectedClient(quotationData.client._id);
      setSelectedContact(quotationData.clientContact._id);
      
      // Transform items to match the expected structure
      const transformedItems = quotationData.items.map((item: any) => ({
        product: item.product?._id || item.product,
        productName: item.productName || item.product?.name || '',
        brand: item.brand || item.product?.brand || '',
        modelName: item.modelName || item.product?.modelName || '',
        specifications: typeof item.specifications === 'object' ? JSON.stringify(item.specifications) : item.specifications || '',
        quantity: item.quantity || 1,
        unit: item.unit || 'pcs',
        unitPrice: item.sellingPrice || item.unitPrice || 0,
        lineTotal: item.lineTotal || 0,
        vendorCost: item.vendorCost || 0,
        profitMargin: item.profitMargin || 0,
        vendorName: item.selectedVendor?.companyName || item.vendorName || '',
        deliveryTime: item.deliveryTime || '',
        warranty: item.warranty || '',
        notes: item.notes || ''
      }));
      
      setItems(transformedItems);
      
      // Format date for input field
      const validUntilDate = quotationData.validUntil ? new Date(quotationData.validUntil).toISOString().split('T')[0] : '';
      setValidUntil(validUntilDate);
      
      setDeliveryTerms(quotationData.deliveryTerms || '');
      setPaymentTerms(quotationData.paymentTerms || '');
      setWarranty(quotationData.warranty || '');
      setNotes(quotationData.notes || '');
      setDiscount(quotationData.discount || 0);
      setDiscountType(quotationData.discountType || 'percentage');
      setTaxRate(quotationData.taxRate || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].lineTotal = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    if (field === 'quantity' || field === 'profitMargin' || field === 'vendorCost') {
      const item = updatedItems[index];
      const marginMultiplier = 1 + (item.profitMargin / 100);
      item.unitPrice = item.vendorCost * marginMultiplier;
      item.lineTotal = item.unitPrice * item.quantity;
    }
    
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addNewItem = () => {
    const newItem: QuotationItem = {
      product: '',
      productName: 'New Product',
      brand: '',
      modelName: '',
      specifications: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      lineTotal: 0,
      vendorCost: 0,
      profitMargin: 25,
    };
    setItems([...items, newItem]);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const grandTotal = afterDiscount + taxAmount;
    
    return { subtotal, discountAmount, taxAmount, grandTotal };
  };

  const handleSave = async () => {
    if (!selectedClient || !selectedContact || items.length === 0) {
      alert('Please fill in all required fields and add at least one item.');
      return;
    }

    setSaving(true);

    try {
      const { subtotal, discountAmount, taxAmount, grandTotal } = calculateTotals();

      const quotationData = {
        client: selectedClient,
        clientContact: selectedContact,
        items,
        subtotal,
        discount,
        discountType,
        taxRate,
        taxAmount,
        grandTotal,
        validUntil,
        deliveryTerms,
        paymentTerms,
        warranty,
        notes,
      };

      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });

      if (response.ok) {
        router.push(`/quotations/${quotationId}`);
      } else {
        throw new Error('Failed to update quotation');
      }
    } catch (error) {
      console.error('Error updating quotation:', error);
      alert('Failed to update quotation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, discountAmount, taxAmount, grandTotal } = calculateTotals();
  const selectedClientData = clients?.find(c => c._id === selectedClient);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading quotation...</div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Quotation not found</h1>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Quotation</h1>
          <p className="text-gray-600 mt-1">
            Editing quotation #{quotation.quotationNumber}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !selectedClient || !selectedContact || items.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
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
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client">Client Company</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedClientData && (
                <div>
                  <Label htmlFor="contact">Contact Person</Label>
                  <Select value={selectedContact} onValueChange={setSelectedContact}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedClientData.contacts.map((contact: any) => (
                        <SelectItem key={contact._id} value={contact._id}>
                          {contact.name} - {contact.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quotation Items</CardTitle>
              <Button onClick={addNewItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Margin %</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="space-y-2">
                            <Input
                              value={item.productName}
                              onChange={(e) => updateItem(index, 'productName', e.target.value)}
                              placeholder="Product name"
                            />
                            <div className="flex gap-2">
                              <Input
                                value={item.brand}
                                onChange={(e) => updateItem(index, 'brand', e.target.value)}
                                placeholder="Brand"
                                className="text-xs"
                              />
                              <Input
                                value={item.modelName}
                                onChange={(e) => updateItem(index, 'modelName', e.target.value)}
                                placeholder="Model"
                                className="text-xs"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-20"
                            min="1"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.vendorCost}
                            onChange={(e) => updateItem(index, 'vendorCost', parseFloat(e.target.value) || 0)}
                            className="w-24"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.profitMargin}
                            onChange={(e) => updateItem(index, 'profitMargin', parseFloat(e.target.value) || 0)}
                            className="w-20"
                            min="0"
                            step="0.1"
                          />
                        </TableCell>
                        <TableCell>{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{item.lineTotal.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No items added yet. Click "Add Item" to get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="deliveryTerms">Delivery Terms</Label>
                <Input
                  id="deliveryTerms"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="warranty">Warranty</Label>
                <Input
                  id="warranty"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or terms..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quotation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Quotation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{subtotal.toFixed(2)} BDT</span>
              </div>
              
              <div className="space-y-2">
                <Label>Discount</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="flex-1"
                    min="0"
                    step="0.01"
                  />
                  <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="fixed">BDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <span>Discount Amount:</span>
                <span>-{discountAmount.toFixed(2)} BDT</span>
              </div>

              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="flex justify-between">
                <span>Tax Amount:</span>
                <span>{taxAmount.toFixed(2)} BDT</span>
              </div>

              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Grand Total:</span>
                <span>{grandTotal.toFixed(2)} BDT</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
