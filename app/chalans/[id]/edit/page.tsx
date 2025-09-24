'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Trash2,
  Package,
  Truck,
  ArrowLeft,
  Save,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Client {
  _id: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  contacts: Array<{
    _id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }>;
}

interface Product {
  _id: string;
  name: string;
  brand: string;
  modelName: string;
  unit: string;
  specifications?: {
    [key: string]: any;
  };
}

interface ChalanItem {
  product: string;
  productName: string;
  brand: string;
  modelName: string;
  specifications?: {
    [key: string]: any;
  };
  quantity: number;
  unit: string;
  deliveryTime?: string;
  warranty?: string;
  notes?: string;
}

interface Chalan {
  _id: string;
  chalanNumber: string;
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
  vehicleNumber?: string;
  receivedBy?: {
    name: string;
    designation: string;
    signature?: string;
    receivedDate?: string;
  };
  notes?: string;
  status: 'draft' | 'dispatched' | 'delivered' | 'received';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditChalanPage() {
  const router = useRouter();
  const params = useParams();
  const chalanId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chalan, setChalan] = useState<Chalan | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [items, setItems] = useState<ChalanItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [transportationDetails, setTransportationDetails] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Dialog states
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [chalanId]);

  const fetchData = async () => {
    try {
      const [chalanResponse, clientsResponse, productsResponse] = await Promise.all([
        fetch(`/api/chalans/${chalanId}`),
        fetch("/api/clients"),
        fetch("/api/products"),
      ]);

      const chalanData = await chalanResponse.json();
      const clientsData = await clientsResponse.json();
      const productsData = await productsResponse.json();

      setChalan(chalanData);
      setClients(clientsData || []);
      setProducts(productsData || []);

      // Populate form with existing data
      if (chalanData) {
        setSelectedClient(chalanData.client._id);
        setSelectedContact(chalanData.clientContact._id);
        setItems(chalanData.items || []);
        setDeliveryAddress(chalanData.deliveryAddress || '');
        setDeliveryDate(chalanData.deliveryDate ? chalanData.deliveryDate.split('T')[0] : '');
        setTransportationDetails(chalanData.transportationDetails || '');
        setDriverName(chalanData.driverName || '');
        setVehicleNumber(chalanData.vehicleNumber || '');
        setNotes(chalanData.notes || '');
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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
      notes: "",
    };

    setItems([...items, newItem]);
    setShowProductDialog(false);
    setProductSearch("");
  };

  const updateItem = (
    index: number,
    field: keyof ChalanItem,
    value: any
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedContact || items.length === 0 || !deliveryAddress || !deliveryDate) {
      alert("Please fill in all required fields and add at least one item.");
      return;
    }

    setSaving(true);
    try {
      const chalanData = {
        client: selectedClient,
        clientContact: selectedContact,
        items,
        deliveryAddress,
        deliveryDate,
        transportationDetails,
        driverName,
        vehicleNumber,
        notes,
      };

      const response = await fetch(`/api/chalans/${chalanId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chalanData),
      });

      if (response.ok) {
        router.push(`/chalans/${chalanId}`);
      } else {
        throw new Error("Failed to update chalan");
      }
    } catch (error) {
      console.error("Error updating chalan:", error);
      alert("Failed to update chalan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.brand?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.modelName?.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  const selectedClientData = clients?.find((c) => c._id === selectedClient);

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
          <h1 className="text-2xl font-bold text-red-600">Delivery note not found</h1>
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Delivery Note</h1>
            <p className="text-gray-600 mt-1">#{chalan.chalanNumber}</p>
          </div>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.push(`/chalans/${chalanId}`)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              saving ||
              !selectedClient ||
              !selectedContact ||
              items.length === 0 ||
              !deliveryAddress ||
              !deliveryDate
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
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
                <Label htmlFor="client">Client Company *</Label>
                <Select
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                >
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
                  <Button>
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
                              <TableCell
                                colSpan={4}
                                className="text-center py-8 text-gray-500"
                              >
                                {productSearch
                                  ? "No products found matching your search."
                                  : "No products available."}
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
              {items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.productName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.brand} {item.modelName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20"
                            min="1"
                          />
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          <Input
                            value={item.notes || ''}
                            onChange={(e) =>
                              updateItem(index, "notes", e.target.value)
                            }
                            placeholder="Notes..."
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
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
                  No items added yet. Click "Add Product" to get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery & Transportation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery & Transportation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <Textarea
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter complete delivery address..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryDate">Delivery Date *</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                  <Input
                    id="vehicleNumber"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g., DH-1234"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="driverName">Driver Name</Label>
                  <Input
                    id="driverName"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver's name"
                  />
                </div>
                <div>
                  <Label htmlFor="transportationDetails">Transportation Details</Label>
                  <Input
                    id="transportationDetails"
                    value={transportationDetails}
                    onChange={(e) => setTransportationDetails(e.target.value)}
                    placeholder="e.g., Express delivery, Fragile items"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes or instructions..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Quantity:</span>
                  <span className="font-medium">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </div>

              {selectedClientData && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Client Details</h4>
                  <div className="text-sm space-y-1">
                    <div>{selectedClientData.companyName}</div>
                    {selectedClientData.address && (
                      <div className="text-gray-600">{selectedClientData.address}</div>
                    )}
                    {selectedClientData.phone && (
                      <div className="text-gray-600">{selectedClientData.phone}</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
