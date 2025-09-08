'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Users, 
  Package, 
  Building2, 
  TrendingUp, 
  DollarSign,
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalQuotations: number;
  pendingQuotations: number;
  acceptedQuotations: number;
  totalClients: number;
  totalProducts: number;
  totalVendors: number;
  avgProfitMargin: number;
  monthlyRevenue: number;
}

interface RecentQuotation {
  _id: string;
  quotationNumber: string;
  client: { companyName: string };
  grandTotal: number;
  status: string;
  createdAt: string;
  profitSummary: { profitPercentage: number };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotations: 0,
    pendingQuotations: 0,
    acceptedQuotations: 0,
    totalClients: 0,
    totalProducts: 0,
    totalVendors: 0,
    avgProfitMargin: 0,
    monthlyRevenue: 0,
  });
  const [recentQuotations, setRecentQuotations] = useState<RecentQuotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch recent quotations
      const quotationsResponse = await fetch('/api/quotations?limit=5');
      const quotationsData = await quotationsResponse.json();
      
      if (quotationsData.quotations) {
        setRecentQuotations(quotationsData.quotations);
        
        // Calculate stats from quotations
        const quotations = quotationsData.quotations;
        setStats({
          totalQuotations: quotations.length,
          pendingQuotations: quotations.filter((q: any) => q.status === 'sent').length,
          acceptedQuotations: quotations.filter((q: any) => q.status === 'accepted').length,
          totalClients: 0, // Will be updated when we fetch clients
          totalProducts: 0, // Will be updated when we fetch products
          totalVendors: 0, // Will be updated when we fetch vendors
          avgProfitMargin: quotations.length > 0 
            ? quotations.reduce((sum: number, q: any) => sum + q.profitSummary.profitPercentage, 0) / quotations.length
            : 0,
          monthlyRevenue: quotations
            .filter((q: any) => q.status === 'accepted')
            .reduce((sum: number, q: any) => sum + q.grandTotal, 0),
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      review: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-red-100 text-red-800',
      converted: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Supply Desk</h1>
          <p className="text-gray-600 mt-1">Manage your industrial equipment quotations efficiently</p>
        </div>
        <Link href="/quotations/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Quotation
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingQuotations} pending approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Quotes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptedQuotations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalQuotations > 0 ? ((stats.acceptedQuotations / stats.totalQuotations) * 100).toFixed(1) : 0}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Profit Margin</CardTitle>
            <DollarSign className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProfitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all quotations
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From accepted quotations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Quotations */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Quotations</CardTitle>
              <Link href="/quotations">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentQuotations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Profit %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentQuotations.map((quotation) => (
                      <TableRow key={quotation._id}>
                        <TableCell className="font-medium">
                          <Link 
                            href={`/quotations/${quotation._id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {quotation.quotationNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{quotation.client.companyName}</TableCell>
                        <TableCell>{formatCurrency(quotation.grandTotal)}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            quotation.profitSummary.profitPercentage > 20 
                              ? 'text-green-600' 
                              : quotation.profitSummary.profitPercentage > 10 
                              ? 'text-yellow-600' 
                              : 'text-red-600'
                          }`}>
                            {quotation.profitSummary.profitPercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                        <TableCell>{formatDate(quotation.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No quotations yet</p>
                  <Link href="/quotations/new">
                    <Button>Create Your First Quotation</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/quotations/new" className="block">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Quotation
                </Button>
              </Link>
              <Link href="/clients" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Clients
                </Button>
              </Link>
              <Link href="/products" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  Manage Products
                </Button>
              </Link>
              <Link href="/vendors" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="w-4 h-4 mr-2" />
                  Manage Vendors
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Backup</span>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Users</span>
                <span className="text-sm text-gray-500">1</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
