import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  FileText,
  DollarSign
} from "lucide-react";

interface VendorStatus {
  name: string;
  path: string;
  status: 'up-to-date' | 'needs-attention' | 'pending-review' | 'no-data';
  totalInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalAmount: number;
  lastUpdate: string | null;
}

const VendorValidation = () => {
  const navigate = useNavigate();

  // Fetch CCM data
  const { data: ccmData } = useQuery({
    queryKey: ['ccm-validation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ccm_invoice')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch DCLI data
  const { data: dcliData } = useQuery({
    queryKey: ['dcli-validation'],
    queryFn: async () => {
      // dcli_invoice_line_item table doesn't exist
      return [];
    }
  });

  // Fetch FLEXIVAN data
  const { data: flexivanData } = useQuery({
    queryKey: ['flexivan-validation'],
    queryFn: async () => {
      // flexivan_activity table doesn't exist
      return [];
    }
  });

  const getVendorStatus = (vendorName: string): VendorStatus => {
    let data: any[] = [];
    let path = '';

    switch (vendorName) {
      case 'CCM':
        data = ccmData || [];
        path = '/vendors/ccm';
        break;
      case 'DCLI':
        data = dcliData || [];
        path = '/vendors/dcli';
        break;
      case 'FLEXIVAN':
        data = flexivanData || [];
        path = '/vendors/flexivan';
        break;
      case 'TRAC':
        path = '/vendors/trac';
        return {
          name: vendorName,
          path,
          status: 'no-data',
          totalInvoices: 0,
          pendingInvoices: 0,
          overdueInvoices: 0,
          totalAmount: 0,
          lastUpdate: null
        };
      case 'SCSPA':
        path = '/vendors/scspa';
        return {
          name: vendorName,
          path,
          status: 'no-data',
          totalInvoices: 0,
          pendingInvoices: 0,
          overdueInvoices: 0,
          totalAmount: 0,
          lastUpdate: null
        };
    }

    if (!data || data.length === 0) {
      return {
        name: vendorName,
        path,
        status: 'no-data',
        totalInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        totalAmount: 0,
        lastUpdate: null
      };
    }

    const totalInvoices = data.length;
    
    // Calculate pending and overdue based on vendor-specific fields
    let pendingInvoices = 0;
    let overdueInvoices = 0;
    let totalAmount = 0;
    let lastUpdate: string | null = null;

    if (vendorName === 'CCM') {
      pendingInvoices = data.filter(inv => inv.status === 'pending').length;
      overdueInvoices = data.filter(inv => {
        const dueDate = inv.invoice_date ? new Date(inv.invoice_date) : null;
        return dueDate && dueDate < new Date() && inv.status !== 'paid';
      }).length;
      totalAmount = data.reduce((sum, inv) => sum + (Number(inv.total_amount_usd) || 0), 0);
      lastUpdate = data[0]?.updated_at || null;
    } else if (vendorName === 'DCLI') {
      pendingInvoices = data.filter(inv => inv.invoice_status === 'pending').length;
      overdueInvoices = data.filter(inv => {
        const dueDate = inv.due_date ? new Date(inv.due_date) : null;
        return dueDate && dueDate < new Date() && inv.invoice_status !== 'paid';
      }).length;
      totalAmount = data.reduce((sum, inv) => sum + (Number(inv.invoice_total) || 0), 0);
      lastUpdate = data[0]?.updated_at || null;
    } else if (vendorName === 'FLEXIVAN') {
      pendingInvoices = data.filter(inv => inv.status === 'pending' || inv.outstanding_balance > 0).length;
      overdueInvoices = data.filter(inv => {
        const dueDate = inv.due_date ? new Date(inv.due_date) : null;
        return dueDate && dueDate < new Date() && inv.outstanding_balance > 0;
      }).length;
      totalAmount = data.reduce((sum, inv) => sum + (Number(inv.invoice_amount) || 0), 0);
      lastUpdate = data[0]?.invoice_date || null;
    }

    // Determine status
    let status: VendorStatus['status'];
    if (overdueInvoices > 0) {
      status = 'needs-attention';
    } else if (pendingInvoices > 0) {
      status = 'pending-review';
    } else {
      status = 'up-to-date';
    }

    return {
      name: vendorName,
      path,
      status,
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      totalAmount,
      lastUpdate
    };
  };

  const vendors = ['CCM', 'DCLI', 'FLEXIVAN', 'TRAC', 'SCSPA'];
  const vendorStatuses = vendors.map(getVendorStatus);

  const getStatusBadge = (status: VendorStatus['status']) => {
    switch (status) {
      case 'up-to-date':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Up to Date
          </Badge>
        );
      case 'needs-attention':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Needs Attention
          </Badge>
        );
      case 'pending-review':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'no-data':
        return (
          <Badge variant="secondary">
            No Data
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: VendorStatus['status']) => {
    switch (status) {
      case 'up-to-date':
        return <CheckCircle2 className="w-8 h-8 text-green-600" />;
      case 'needs-attention':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      case 'pending-review':
        return <Clock className="w-8 h-8 text-yellow-600" />;
      case 'no-data':
        return <FileText className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Summary stats
  const totalInvoices = vendorStatuses.reduce((sum, v) => sum + v.totalInvoices, 0);
  const totalPending = vendorStatuses.reduce((sum, v) => sum + v.pendingInvoices, 0);
  const totalOverdue = vendorStatuses.reduce((sum, v) => sum + v.overdueInvoices, 0);
  const totalAmount = vendorStatuses.reduce((sum, v) => sum + v.totalAmount, 0);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Equipment Vendor Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Monitor invoice status across all vendors
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">Across all vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">Awaiting validation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOverdue}</div>
            <p className="text-xs text-muted-foreground">Needs immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">Outstanding value</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vendorStatuses.map((vendor) => (
          <Card key={vendor.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold">{vendor.name}</CardTitle>
                  {getStatusBadge(vendor.status)}
                </div>
                {getStatusIcon(vendor.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                  <p className="text-2xl font-semibold">{vendor.totalInvoices}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-semibold">{formatCurrency(vendor.totalAmount)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    {vendor.pendingInvoices}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    {vendor.overdueInvoices}
                  </Badge>
                </div>
              </div>

              {vendor.lastUpdate && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Last updated: {formatDate(vendor.lastUpdate)}
                  </p>
                </div>
              )}

              <Button 
                className="w-full mt-4" 
                onClick={() => navigate(vendor.path)}
                variant={vendor.status === 'needs-attention' ? 'default' : 'outline'}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VendorValidation;
