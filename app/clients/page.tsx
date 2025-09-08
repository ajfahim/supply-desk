"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Edit, Plus, Search, Trash2, Building2, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface Client {
  _id: string;
  companyName: string;
  industry: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contacts: Array<{
    _id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "Bangladesh",
      zipCode: "",
    },
    contacts: [
      {
        name: "",
        title: "",
        email: "",
        phone: "",
        isPrimary: true,
      },
    ],
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingClient
        ? `/api/clients/${editingClient._id}`
        : "/api/clients";
      const method = editingClient ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchClients();
        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to save client");
      }
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Failed to save client");
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      companyName: client.companyName,
      industry: client.industry || "",
      address: client.address || {
        street: "",
        city: "",
        state: "",
        country: "Bangladesh",
        zipCode: "",
      },
      contacts: client.contacts.length > 0 ? client.contacts : [
        {
          name: "",
          title: "",
          email: "",
          phone: "",
          isPrimary: true,
        },
      ],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchClients();
      } else {
        alert("Failed to delete client");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Failed to delete client");
    }
  };

  const resetForm = () => {
    setEditingClient(null);
    setFormData({
      companyName: "",
      industry: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "Bangladesh",
        zipCode: "",
      },
      contacts: [
        {
          name: "",
          title: "",
          email: "",
          phone: "",
          isPrimary: true,
        },
      ],
    });
  };

  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [
        ...formData.contacts,
        {
          name: "",
          title: "",
          email: "",
          phone: "",
          isPrimary: false,
        },
      ],
    });
  };

  const removeContact = (index: number) => {
    if (formData.contacts.length > 1) {
      const newContacts = formData.contacts.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        contacts: newContacts,
      });
    }
  };

  const updateContact = (index: number, field: string, value: any) => {
    const newContacts = [...formData.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setFormData({
      ...formData,
      contacts: newContacts,
    });
  };

  const filteredClients = clients.filter((client) =>
    client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-2">
              Manage your client companies and contacts
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Edit Client" : "Add New Client"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Company Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({ ...formData, companyName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) =>
                          setFormData({ ...formData, industry: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Address</h3>
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, street: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, city: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.address.state}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, state: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.address.country}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, country: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.address.zipCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, zipCode: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Contacts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Contacts</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addContact}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Contact
                    </Button>
                  </div>
                  {formData.contacts.map((contact, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">
                          Contact {index + 1}
                          {contact.isPrimary && (
                            <Badge variant="secondary" className="ml-2">
                              Primary
                            </Badge>
                          )}
                        </h4>
                        {formData.contacts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContact(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={contact.name}
                            onChange={(e) =>
                              updateContact(index, "name", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={contact.title}
                            onChange={(e) =>
                              updateContact(index, "title", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) =>
                              updateContact(index, "email", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={contact.phone}
                            onChange={(e) =>
                              updateContact(index, "phone", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingClient ? "Update" : "Create"} Client
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Clients ({filteredClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const primaryContact = client.contacts.find(c => c.isPrimary) || client.contacts[0];
                  return (
                    <TableRow key={client._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.companyName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.industry && (
                          <Badge variant="outline">{client.industry}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {primaryContact && (
                          <div>
                            <div className="font-medium text-sm">{primaryContact.name}</div>
                            <div className="text-xs text-gray-500">{primaryContact.title}</div>
                            <div className="text-xs text-gray-500">{primaryContact.email}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {client.address?.city && client.address?.country && (
                            `${client.address.city}, ${client.address.country}`
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span className="text-sm">{client.contacts.length}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredClients.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No clients found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
