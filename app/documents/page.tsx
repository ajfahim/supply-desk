'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  FileText,
  Receipt,
  Package,
  Plus,
  Search,
  Eye,
  Edit,
  Filter,
  Download,
} from 'lucide-react';

interface Document {
  _id: string;
  number: string;
  client: {
    companyName: string;
  };
  clientContact: {
    name: string;
  };
  status: string;
  createdAt: string;
  total?: number;
  items?: any[];
  type: 'quotation' | 'invoice' | 'chalan';
}

export default function DocumentsHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, statusFilter, activeTab]);

  const fetchAllDocuments = async () => {
    try {
      const [quotationsRes, invoicesRes, chalansRes] = await Promise.all([
        fetch('/api/quotations'),
        fetch('/api/invoices'),
        fetch('/api/chalans')
      ]);

      const quotationsData = await quotationsRes.json();
      const invoicesData = await invoicesRes.json();
      const chalansData = await chalansRes.json();

      const allDocuments: Document[] = [
        ...(quotationsData.quotations || []).map((q: any) => ({
          ...q,
          number: q.quotationNumber,
          type: 'quotation' as const
        })),
        ...(invoicesData.invoices || []).map((i: any) => ({
          ...i,
          number: i.invoiceNumber,
          type: 'invoice' as const
        })),
        ...(chalansData.chalans || []).map((c: any) => ({
          ...c,
          number: c.chalanNumber,
          type: 'chalan' as const
        }))
      ];

      // Sort by creation date (newest first)
      allDocuments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by document type
    if (activeTab !== 'all') {
      filtered = filtered.filter(doc => doc.type === activeTab);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.clientContact.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'quotation': return <FileText className="w-4 h-4" />;
      case 'invoice': return <Receipt className="w-4 h-4" />;
      case 'chalan': return <Package className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === 'quotation') {
      switch (status) {
        case 'draft': return 'bg-gray-100 text-gray-800';
        case 'sent': return 'bg-blue-100 text-blue-800';
        case 'accepted': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else if (type === 'invoice') {
      switch (status) {
        case 'draft': return 'bg-gray-100 text-gray-800';
        case 'sent': return 'bg-blue-100 text-blue-800';
        case 'paid': return 'bg-green-100 text-green-800';
        case 'overdue': return 'bg-red-100 text-red-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else if (type === 'chalan') {
      switch (status) {
        case 'draft': return 'bg-gray-100 text-gray-800';
        case 'dispatched': return 'bg-blue-100 text-blue-800';
        case 'delivered': return 'bg-yellow-100 text-yellow-800';
        case 'received': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleView = (doc: Document) => {
    router.push(`/${doc.type}s/${doc._id}`);
  };

  const handleEdit = (doc: Document) => {
    router.push(`/${doc.type}s/${doc._id}/edit`);
  };

  const handleCreate = (type: string) => {
    router.push(`/${type}s/new`);
  };

  const getDocumentCounts = () => {
    const quotations = documents.filter(d => d.type === 'quotation').length;
    const invoices = documents.filter(d => d.type === 'invoice').length;
    const chalans = documents.filter(d => d.type === 'chalan').length;
    return { quotations, invoices, chalans, total: documents.length };
  };

  const counts = getDocumentCounts();

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading documents...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents Hub</h1>
          <p className="text-gray-600 mt-1">
            Manage all your quotations, invoices, and delivery notes in one place
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handleCreate('quotation')}
          >
            <FileText className="w-4 h-4 mr-2" />
            New Quotation
          </Button>
          <Button
            variant="outline"
            onClick={() => handleCreate('invoice')}
          >
            <Receipt className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
          <Button
            onClick={() => handleCreate('chalan')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Package className="w-4 h-4 mr-2" />
            New Delivery Note
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{counts.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quotations</p>
                <p className="text-2xl font-bold">{counts.quotations}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Invoices</p>
                <p className="text-2xl font-bold">{counts.invoices}</p>
              </div>
              <Receipt className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery Notes</p>
                <p className="text-2xl font-bold">{counts.chalans}</p>
              </div>
              <Package className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Documents</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by document number, client, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="status">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
              <TabsTrigger value="quotation">Quotations ({counts.quotations})</TabsTrigger>
              <TabsTrigger value="invoice">Invoices ({counts.invoices})</TabsTrigger>
              <TabsTrigger value="chalan">Delivery Notes ({counts.chalans})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredDocuments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Document #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={`${doc.type}-${doc._id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDocumentIcon(doc.type)}
                            <span className="capitalize">{doc.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{doc.number}</TableCell>
                        <TableCell>{doc.client.companyName}</TableCell>
                        <TableCell>{doc.clientContact.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(doc.status, doc.type)}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(doc.createdAt)}</TableCell>
                        <TableCell>
                          {doc.total ? formatCurrency(doc.total) : 
                           doc.type === 'chalan' ? `${doc.items?.length || 0} items` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(doc)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No documents found matching your filters.'
                      : 'No documents created yet.'}
                  </div>
                  {!searchTerm && statusFilter === 'all' && (
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleCreate('quotation')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Quotation
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCreate('invoice')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Invoice
                      </Button>
                      <Button
                        onClick={() => handleCreate('chalan')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Delivery Note
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
