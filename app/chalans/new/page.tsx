'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Package, Plus, Search, Trash2 } from 'lucide-react';

interface Client {
  _id: string;
  companyName: string;
  contacts: {
    _id: string;
    name: string;
    title: string;
    email: string;
    phone?: string;
  }[];
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

interface Product {
  _id: string;
  name: string;
  brand: string;
  modelName: string;
  specifications: {
    [key: string]: string | number | boolean;
  };
  unit: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: Client;
  clientContact: {
    _id: string;
    name: string;
    title: string;
    email: string;
    phone?: string;
  };
  items: any[];
}

interface ChalanItem {
  product: string;
  productName: string;
  brand: string;
  modelName: string;
  specifications: {
    [key: string]: string | number | boolean;
  };
  quantity: number;
  unit: string;
  deliveryTime?: string;
  warranty?: string;
}

export default function NewChalanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [items, setItems] = useState<ChalanItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [transportationDetails, setTransportationDetails] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Dialog states
  const [showProductDialog, setShowProductDialog] = useState(false);

  useEffect(() => {
    fetchClientsAndProducts();
  }, []);

  const fetchClientsAndProducts = async () => {
    try {
      const [clientsResponse, productsResponse, invoicesResponse] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/products"),
        fetch("/api/invoices"),
      ]);

      if (clientsResponse.ok && productsResponse.ok && invoicesResponse.ok) {
        const clientsData = await clientsResponse.json();
        const productsData = await productsResponse.json();
        const invoicesData = await invoicesResponse.json();
        setClients(Array.isArray(clientsData) ? clientsData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setInvoices(Array.isArray(invoicesData.invoices) ? invoicesData.invoices : []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setClients([]);
      setProducts([]);
      setInvoices([]);
    }
  };

  const handleInvoiceSelection = async (invoiceId: string) => {
    if (!invoiceId || invoiceId === 'none') {
      setSelectedInvoice('');
      setSelectedClient('');
      setSelectedContact('');
      setItems([]);
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (response.ok) {
        const invoice = await response.json();
        setSelectedInvoice(invoiceId);
        setSelectedClient(invoice.client._id);
        
        // Handle clientContact - find matching contact in client's contacts array
        let contactId = '';
        if (invoice.clientContact) {
          // If clientContact is populated, find matching contact by name/email
          if (typeof invoice.clientContact === 'object' && invoice.clientContact.name) {
            const matchingContact = invoice.client.contacts?.find((contact: any) => 
              contact.name === invoice.clientContact.name || 
              contact.email === invoice.clientContact.email
            );
            contactId = matchingContact?._id || '';
          } else {
            // If it's just an ID, use it directly
            contactId = invoice.clientContact;
          }
        }
        setSelectedContact(contactId);
        
        // Convert invoice items to chalan items (without prices)
        const chalanItems = invoice.items.map((item: any) => ({
          product: item.product._id,
          productName: item.productName,
          brand: item.product?.brand || '',
          modelName: item.product?.modelName || '',
          specifications: item.product?.specifications || {},
          quantity: item.quantity,
          unit: item.unit,
          deliveryTime: item.deliveryTime || '',
          warranty: item.warranty || '',
        }));
        setItems(chalanItems);
        
        // Set delivery address from client address if available
        if (invoice.client.address) {
          const address = typeof invoice.client.address === 'string' 
            ? invoice.client.address 
            : `${invoice.client.address.street || ''}, ${invoice.client.address.city || ''}, ${invoice.client.address.country || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
          setDeliveryAddress(address);
        }
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    }
  };

  const addProduct = (product: Product) => {
    const newItem: ChalanItem = {
      product: product._id,
      productName: product.name,
      brand: product.brand,
      modelName: product.modelName,
      specifications: product.specifications,
      quantity: 1,
      unit: product.unit,
      deliveryTime: "",
      warranty: "",
    };
    setItems([...items, newItem]);
    setShowProductDialog(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ChalanItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedContact || items.length === 0 || !deliveryAddress || !deliveryDate) {
      alert("Please fill in all required fields and add at least one item.");
      return;
    }

    setLoading(true);
    try {
      const chalanData = {
        invoice: selectedInvoice || undefined,
        client: selectedClient,
        clientContact: selectedContact,
        items,
        deliveryAddress,
        deliveryDate,
        transportationDetails,
        driverName,
        driverPhone,
        vehicleNumber,
      };

      const response = await fetch("/api/chalans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chalanData),
      });

      if (response.ok) {
        const newChalan = await response.json();
        router.push(`/chalans/${newChalan._id}`);
      } else {
        alert("Failed to create delivery note");
      }
    } catch (error) {
      console.error("Error creating chalan:", error);
      alert("Failed to create delivery note");
    } finally {
      setLoading(false);
    }
  };

  const selectedClientData = clients.find(c => c._id === selectedClient);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.modelName.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Create New Delivery Note</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !selectedClient ||
              !selectedContact ||
              items.length === 0 ||
              !deliveryAddress ||
              !deliveryDate
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Package className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Create Delivery Note"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice & Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice & Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invoice">Select Invoice (Optional)</Label>
                <Select value={selectedInvoice} onValueChange={handleInvoiceSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an invoice to auto-populate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Create without invoice</SelectItem>
                    {Array.isArray(invoices) && invoices.map((invoice) => (
                      <SelectItem key={invoice._id} value={invoice._id}>
                        {invoice.invoiceNumber} - {invoice.client?.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedInvoice && (
                  <p className="text-sm text-gray-600 mt-1">
                    Items and client details will be auto-populated from the selected invoice.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="client">Client *</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient} disabled={!!selectedInvoice}>
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
                  <Label htmlFor="contact">Contact Person *</Label>
                  <Select
                    value={selectedContact}
                    onValueChange={setSelectedContact}
                    disabled={!!selectedInvoice}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedClientData.contacts.map((contact) => (
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
              <CardTitle>Delivery Items</CardTitle>
              <Dialog
                open={showProductDialog}
                onOpenChange={setShowProductDialog}
              >
                <DialogTrigger asChild>
                  <Button disabled={!!selectedInvoice}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="min-w-[50vw] overflow-auto overflow-x-hidden">
                  <DialogHeader>
                    <DialogTitle>Select Product</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col h-full space-y-4">
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Search className="w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-h-[50vh] border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Brand/Model</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                              <TableRow key={product._id}>
                                <TableCell>
                                  <div className="font-medium">
                                    {product.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {product.brand} {product.modelName}
                                </TableCell>
                                <TableCell>{product.unit}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    onClick={() => addProduct(product)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    Add
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8">
                                <div className="text-gray-500">
                                  No products found matching "{productSearch}"
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {selectedInvoice ? "Items will be populated from the selected invoice." : "No items added yet. Click \"Add Product\" to get started."}
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{item.productName}</h4>
                          {item.brand && (
                            <p className="text-sm text-gray-600">
                              {item.brand} {item.modelName}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700"
                          disabled={!!selectedInvoice}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", parseInt(e.target.value) || 1)
                            }
                          />
                        </div>
                        <div>
                          <Label>Unit</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => updateItem(index, "unit", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Details */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <Textarea
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Transportation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Transportation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transportationDetails">Transportation Method</Label>
                <Input
                  id="transportationDetails"
                  value={transportationDetails}
                  onChange={(e) => setTransportationDetails(e.target.value)}
                  placeholder="e.g., Truck, Van, Courier"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="driverName">Driver Name</Label>
                  <Input
                    id="driverName"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver name"
                  />
                </div>
                <div>
                  <Label htmlFor="driverPhone">Driver Phone</Label>
                  <Input
                    id="driverPhone"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="Driver phone number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                  <Input
                    id="vehicleNumber"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="Vehicle number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Quantity:</span>
                  <span className="font-medium">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
