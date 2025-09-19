"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

interface PricingAnalytics {
  totalProducts: number;
  totalVendors: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
  bestDeals: Array<{
    vendorId: string;
    vendorName: string;
    price: number;
    currency: string;
    reliability: number;
  }>;
  vendorComparison: Array<{
    vendorId: string;
    vendorName: string;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    priceCount: number;
    reliability: number;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface PricingAnalyticsDashboardProps {
  productId?: string;
  vendorId?: string;
  category?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PricingAnalyticsDashboard({
  productId,
  vendorId,
  category,
}: PricingAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<PricingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [productId, vendorId, category]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (productId) params.append('productId', productId);
      if (vendorId) params.append('vendorId', vendorId);
      if (category) params.append('category', category);

      const response = await fetch(`/api/pricing/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Error loading analytics: {error}</p>
            <Button onClick={fetchAnalytics} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = analytics.vendorComparison.map((vendor, index) => ({
    name: vendor.vendorName.length > 15 
      ? vendor.vendorName.substring(0, 15) + '...' 
      : vendor.vendorName,
    avgPrice: vendor.avgPrice,
    reliability: vendor.reliability,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalVendors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgPrice.toFixed(2)} BDT</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Range</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.priceRange.toFixed(2)} BDT</div>
            <p className="text-xs text-muted-foreground">
              {analytics.minPrice.toFixed(2)} - {analytics.maxPrice.toFixed(2)} BDT
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Price Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} BDT`,
                    name === 'avgPrice' ? 'Average Price' : 'Reliability'
                  ]}
                />
                <Bar dataKey="avgPrice" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Reliability Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, reliability }) => `${name}: ${reliability}/5`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="reliability"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Best Deals */}
      {analytics.bestDeals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-600" />
              Best Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Reliability</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.bestDeals.map((deal, index) => (
                  <TableRow key={deal.vendorId}>
                    <TableCell className="font-medium">{deal.vendorName}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {deal.price.toLocaleString()} {deal.currency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {deal.reliability}/5 ⭐
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(rec.priority)}
                    <div className="flex-1">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <p className="text-sm mt-1">{rec.description}</p>
                      <p className="text-sm font-medium mt-2">
                        Action: {rec.action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Vendor Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Avg Price</TableHead>
                <TableHead>Price Range</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Reliability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.vendorComparison.map((vendor) => (
                <TableRow key={vendor.vendorId}>
                  <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                  <TableCell>{vendor.avgPrice.toFixed(2)} BDT</TableCell>
                  <TableCell>
                    {vendor.minPrice.toFixed(2)} - {vendor.maxPrice.toFixed(2)} BDT
                  </TableCell>
                  <TableCell>{vendor.priceCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {vendor.reliability}/5 ⭐
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
