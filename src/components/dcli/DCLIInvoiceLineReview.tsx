import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Paperclip, 
  Eye,
  Edit,
  MessageSquare,
  Calendar,
  DollarSign
} from "lucide-react";
import { useDCLIData } from '@/hooks/useDCLIData';

interface DCLIInvoiceLineReviewProps {
  onViewDetail: (record: any) => void;
}

const DCLIInvoiceLineReview: React.FC<DCLIInvoiceLineReviewProps> = ({ onViewDetail }) => {
  const { invoiceData, activityData, loading } = useDCLIData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [internalStatusFilter, setInternalStatusFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  // Generate line items based on actual activity data and invoice context
  const generateLineItems = (invoice: any) => {
    // Find related activities for this invoice
    const relatedActivities = activityData.filter(activity => 
      activity.chassis === invoice.chassis_number ||
      activity.container === invoice.container ||
      activity.booking === invoice.booking
    );
    
    // If we have related activities, use them; otherwise create realistic mock data
    if (relatedActivities.length > 0) {
      return relatedActivities.slice(0, 3).map((activity, i) => ({
        id: `${invoice.invoice_id}-line-${i + 1}`,
        lineNumber: i + 1,
        description: `${activity.product || 'Chassis Usage'} - ${activity.asset_type || 'Standard'}`,
        chassisNumber: activity.chassis || invoice.chassis_number,
        container: activity.container,
        useDays: activity.days_out || Math.floor(Math.random() * 30) + 1,
        dailyRate: invoice.daily_rate || 35,
        amount: (activity.days_out || Math.floor(Math.random() * 30) + 1) * (invoice.daily_rate || 35),
        validated: Math.random() > 0.3,
        hasAttachment: Math.random() > 0.4,
        internalStatus: ['NEED TO DISPUTE', 'OK TO PAY', 'EMAILED AM', 'PENDING REVIEW'][Math.floor(Math.random() * 4)],
        variance: Math.floor(Math.random() * 5) - 2,
        pickupLocation: activity.pick_up_location,
        dropLocation: activity.location_in,
        carrierName: activity.motor_carrier_name,
        steamshipLine: activity.steamship_line_name,
        booking: activity.booking,
        reservationStatus: activity.reservation_status,
        region: activity.region,
        market: activity.market
      }));
    }
    
    // Fallback to generated line items if no activity data
    const lineTypes = [
      'Chassis Daily Use',
      'Maintenance & Repair', 
      'Storage Fees',
      'Inspection Charges'
    ];
    
    return Array.from({ length: Math.floor(Math.random() * 3) + 2 }, (_, i) => ({
      id: `${invoice.invoice_id}-line-${i + 1}`,
      lineNumber: i + 1,
      description: lineTypes[Math.floor(Math.random() * lineTypes.length)],
      chassisNumber: invoice.chassis_number,
      container: invoice.container,
      useDays: Math.floor(Math.random() * 30) + 1,
      dailyRate: 35 + Math.floor(Math.random() * 15),
      amount: (Math.floor(Math.random() * 30) + 1) * (35 + Math.floor(Math.random() * 15)),
      validated: Math.random() > 0.3,
      hasAttachment: Math.random() > 0.4,
      internalStatus: ['NEED TO DISPUTE', 'OK TO PAY', 'EMAILED AM', 'PENDING REVIEW'][Math.floor(Math.random() * 4)],
      variance: Math.floor(Math.random() * 5) - 2,
      pickupLocation: invoice.pick_up_location,
      dropLocation: invoice.location_in,
      carrierName: invoice.carrier_name,
      steamshipLine: invoice.steamship_line,
      booking: invoice.booking,
      region: invoice.region,
      market: invoice.market
    }));
  };

  const formatCurrency = (amount: string | number) => {
    if (!amount) return '$0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '$0.00' : `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Filter invoices based on search and filters
  const filteredInvoices = invoiceData.filter(invoice => {
    const matchesSearch = !searchQuery || 
      Object.values(invoice).some(value => 
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    return status === 'Open' ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
        Open
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
        Closed
      </Badge>
    );
  };

  const getInternalStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'NEED TO DISPUTE': 'bg-red-100 text-red-800 border-red-200',
      'OK TO PAY': 'bg-green-100 text-green-800 border-green-200',
      'EMAILED AM': 'bg-blue-100 text-blue-800 border-blue-200',
      'PENDING REVIEW': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'APPROVED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'REJECTED': 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <Badge variant="outline" className={statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {status}
      </Badge>
    );
  };

  const toggleInvoiceExpansion = (invoiceId: string) => {
    setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-64"></div>
            <div className="h-4 bg-muted rounded w-48"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Invoice & Line-Item Review</h2>
          <p className="text-muted-foreground">Granular control and validation for every charge</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chassis, invoice, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Client Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Client Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={internalStatusFilter} onValueChange={setInternalStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Internal Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Internal Status</SelectItem>
                <SelectItem value="NEED TO DISPUTE">Need to Dispute</SelectItem>
                <SelectItem value="OK TO PAY">OK to Pay</SelectItem>
                <SelectItem value="EMAILED AM">Emailed AM</SelectItem>
                <SelectItem value="PENDING REVIEW">Pending Review</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List with Expandable Line Items */}
      <div className="space-y-4">
        {filteredInvoices.map((invoice) => {
          const lineItems = generateLineItems(invoice);
          const isExpanded = expandedInvoice === invoice.invoice_id;
          
          return (
            <Card key={invoice.invoice_id} className="overflow-hidden">
              {/* Invoice Header */}
              <div 
                className="p-4 border-b bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors"
                onClick={() => toggleInvoiceExpansion(invoice.invoice_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Checkbox />
                    <div>
                      <div className="font-semibold text-lg">Invoice #{invoice.invoice_id}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(invoice.invoice_date)} • {invoice.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(invoice.amount)}</div>
                      <div className="text-sm text-muted-foreground">Due: {formatDate(invoice.due_date)}</div>
                    </div>
                    {getStatusBadge(invoice.status)}
                    <Button variant="ghost" size="sm">
                      {isExpanded ? 'Collapse' : 'Expand'} Lines
                    </Button>
                  </div>
                </div>
              </div>

              {/* Line Items (Expandable) */}
              {isExpanded && (
                <div className="divide-y">
                  {lineItems.map((lineItem) => (
                    <div key={lineItem.id} className="p-4 hover:bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {lineItem.validated ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            )}
                            <span className="text-sm font-medium">Line {lineItem.lineNumber}</span>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="font-medium">{lineItem.description}</div>
                              <div className="text-muted-foreground">
                                Chassis: {lineItem.chassisNumber}
                                {lineItem.container && ` • Container: ${lineItem.container}`}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">{lineItem.useDays} days</div>
                              <div className="text-muted-foreground">
                                {lineItem.variance !== 0 && (
                                  <span className={lineItem.variance > 0 ? 'text-red-600' : 'text-green-600'}>
                                    {lineItem.variance > 0 ? '+' : ''}{lineItem.variance} day variance
                                  </span>
                                )}
                                {lineItem.pickupLocation && (
                                  <div className="text-xs">{lineItem.pickupLocation}</div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">{formatCurrency(lineItem.dailyRate)}/day</div>
                              <div className="text-muted-foreground">Rate</div>
                            </div>
                            <div>
                              <div className="font-medium">{formatCurrency(lineItem.amount)}</div>
                              <div className="text-muted-foreground">Total</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {getInternalStatusBadge(lineItem.internalStatus)}
                          
                          <div className="flex items-center space-x-2">
                            {lineItem.hasAttachment && (
                              <Button variant="ghost" size="sm" className="p-1">
                                <Paperclip className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="p-1">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="p-1">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              No invoices found matching your criteria
            </div>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setInternalStatusFilter('all');
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DCLIInvoiceLineReview;