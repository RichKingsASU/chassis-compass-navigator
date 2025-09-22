import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Calendar, DollarSign, Package, Truck, User } from "lucide-react";

interface TMSDetailViewProps {
  record: any;
  onBack: () => void;
}

const TMSDetailView: React.FC<TMSDetailViewProps> = ({ record, onBack }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: string) => {
    if (!amount) return '$0.00';
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered') || statusLower.includes('complete')) {
      return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
    } else if (statusLower.includes('transit') || statusLower.includes('active')) {
      return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>;
    } else if (statusLower.includes('pending') || statusLower.includes('scheduled')) {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    } else {
      return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Table
        </Button>
        <h1 className="dash-title">
          Shipment Details: {record.shipment_number || `ID ${record.row_id}`}
        </h1>
        {getStatusBadge(record.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Shipment Number</label>
                <p className="font-medium">{record.shipment_number || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Container Number</label>
                <p className="font-medium">{record.container_number || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Master BOL</label>
                <p className="font-medium">{record.mbl || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Chassis Number</label>
                <p className="font-medium">{record.chassis_number || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Container Type</label>
                <p className="font-medium">{record.container_type || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Service Mode</label>
                <p className="font-medium">{record.servicemode || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carrier Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Carrier Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Carrier Name</label>
                <p className="font-medium">{record.carrier_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Carrier SCAC</label>
                <p className="font-medium">{record.carrier_scac_code || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">DOT Number</label>
                <p className="font-medium">{record.dotnumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">MC Number</label>
                <p className="font-medium">{record.mcnumber || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Pickup Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Location</label>
              <p className="font-medium">{record.pickup_loc_name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">
                {record.pickup_addr_1 && `${record.pickup_addr_1}, `}
                {record.pickup_city && `${record.pickup_city}, `}
                {record.pickup_state && `${record.pickup_state} `}
                {record.pickup_zipcode && record.pickup_zipcode}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Appointment Start</label>
                <p className="font-medium">{formatDate(record.pickup_appmt_start)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Appointment End</label>
                <p className="font-medium">{formatDate(record.pickup_appmt_end)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Actual Pickup</label>
                <p className="font-medium">{formatDate(record.pickup_actual_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Region</label>
                <p className="font-medium">{record.pickup_region || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Location</label>
              <p className="font-medium">{record.delivery_loc_name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">
                {record.delivery_addr_1 && `${record.delivery_addr_1}, `}
                {record.delivery_city && `${record.delivery_city}, `}
                {record.delivery_state && `${record.delivery_state} `}
                {record.delivery_zipcode && record.delivery_zipcode}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Appointment Start</label>
                <p className="font-medium">{formatDate(record.delivery_appmt_start)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Appointment End</label>
                <p className="font-medium">{formatDate(record.delivery_appmt_end)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Actual Delivery</label>
                <p className="font-medium">{formatDate(record.delivery_actual_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Region</label>
                <p className="font-medium">{record.delivery_region || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Rate</label>
                <p className="font-medium text-green-600">{formatCurrency(record.cust_rate_charge)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Invoice</label>
                <p className="font-medium text-green-600">{formatCurrency(record.cust_invoice_charge)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Carrier Rate</label>
                <p className="font-medium text-red-600">{formatCurrency(record.carrier_rate_charge)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Carrier Invoice</label>
                <p className="font-medium text-red-600">{formatCurrency(record.carrier_invoice_charge)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Invoice #</label>
                <p className="font-medium">{record.cust_invoice_num || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Carrier Invoice #</label>
                <p className="font-medium">{record.carrier_invoice_num || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                <p className="font-medium">{record.customer_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                <p className="font-medium">{record.customer_account_number || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reference Number</label>
                <p className="font-medium">{record.customer_reference_number || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sales Person</label>
                <p className="font-medium">{record.sales_person || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Details */}
      {(record.vessel_name || record.vessel_eta || record.steamshipline) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Vessel Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vessel Name</label>
                <p className="font-medium">{record.vessel_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vessel ETA</label>
                <p className="font-medium">{formatDate(record.vessel_eta)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Steamship Line</label>
                <p className="font-medium">{record.steamshipline || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TMSDetailView;