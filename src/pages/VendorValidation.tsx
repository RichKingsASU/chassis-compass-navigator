import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  FileText,
  DollarSign,
  ChevronRight,
  ChevronDown
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
      const { data, error } = await supabase
        .from('dcli_invoice_line_item')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch FLEXIVAN data
  const { data: flexivanData } = useQuery({
    queryKey: ['flexivan-validation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flexivan_activity')
        .select('*');
      if (error) throw error;
      return data || [];
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
          <h2 className="text-3xl font-bold tracking-tight">Vendor Validation Dashboard</h2>
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

      {/* Vendor Tree View */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Invoice Status Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vendorStatuses.map((vendor) => (
              <VendorTreeNode key={vendor.name} vendor={vendor} navigate={navigate} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Separate component for tree nodes with collapsible functionality
const VendorTreeNode: React.FC<{ vendor: VendorStatus; navigate: any }> = ({ vendor, navigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusBadge = (status: VendorStatus['status']) => {
    switch (status) {
      case 'up-to-date':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Up to Date
          </Badge>
        );
      case 'needs-attention':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Needs Attention
          </Badge>
        );
      case 'pending-review':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'no-data':
        return (
          <Badge variant="secondary" className="text-xs">
            No Data
          </Badge>
        );
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-semibold text-base">{vendor.name}</span>
                {getStatusBadge(vendor.status)}
              </div>
            </Button>
          </CollapsibleTrigger>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Invoices</p>
              <p className="font-semibold">{vendor.totalInvoices}</p>
            </div>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => navigate(vendor.path)}
            >
              View Portal
            </Button>
          </div>
        </div>

        <CollapsibleContent className="mt-3 space-y-3 border-t pt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
              <p className="text-lg font-bold">{formatCurrency(vendor.totalAmount)}</p>
            </div>
            
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-muted-foreground mb-1">Pending Review</p>
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                {vendor.pendingInvoices}
              </p>
            </div>
            
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs text-muted-foreground mb-1">Overdue</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-400">
                {vendor.overdueInvoices}
              </p>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-muted-foreground mb-1">Completed</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                {vendor.totalInvoices - vendor.pendingInvoices - vendor.overdueInvoices}
              </p>
            </div>
          </div>

          {vendor.lastUpdate && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(vendor.lastUpdate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              className="flex-1"
              onClick={() => navigate(vendor.path)}
              variant={vendor.status === 'needs-attention' ? 'default' : 'outline'}
            >
              View All Invoices
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default VendorValidation;
