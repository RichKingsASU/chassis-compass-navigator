import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Save, X, FileText, Clock, DollarSign, Truck } from "lucide-react";

interface DCLIDetailViewProps {
  record: any;
  onBack: () => void;
}

const DCLIDetailView: React.FC<DCLIDetailViewProps> = ({ record, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [internalStatus, setInternalStatus] = useState('');
  const [disputeAmount, setDisputeAmount] = useState('');
  const [chargeCategory, setChargeCategory] = useState('');

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string | number) => {
    if (!amount) return '$0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '$0.00' : `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Active': 'bg-green-100 text-green-800 border-green-200',
      'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
      'On Hold': 'bg-red-100 text-red-800 border-red-200',
      'Completed': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Completed'];
    
    return (
      <Badge className={config}>
        {status || 'Unknown'}
      </Badge>
    );
  };

  const handleSave = () => {
    // Here you would typically save to your backend
    console.log('Saving internal data:', {
      internalNotes,
      internalStatus,
      disputeAmount,
      chargeCategory
    });
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tracker
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Asset Detail View</h1>
            <p className="text-muted-foreground">
              {record.chassis || 'No Chassis'} • {record.container || 'No Container'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Internal Data
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Information - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Asset Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm text-muted-foreground">Chassis Number</Label>
                  <div className="font-medium">{record.chassis || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Container Number</Label>
                  <div className="font-medium">{record.container || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Serial Number</Label>
                  <div className="font-medium">{record.serial_number || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">VIN</Label>
                  <div className="font-medium">{record.vin || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">License Plate</Label>
                  <div className="font-medium">{record.license_plate || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Asset Type</Label>
                  <div className="font-medium">{record.asset_type || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carrier & Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Carrier & Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm text-muted-foreground">Motor Carrier</Label>
                  <div className="font-medium">{record.motor_carrier_name || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">SCAC: {record.motor_carrier_scac || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Steamship Line</Label>
                  <div className="font-medium">{record.steamship_line_name || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">SCAC: {record.steamship_line_scac || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">BCO/NVOCC</Label>
                  <div className="font-medium">{record.bco_nvocc_name || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">SCAC: {record.bco_nvocc_scac || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Allotment Company</Label>
                  <div className="font-medium">{record.allotment_company_name || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Booking/BOL</Label>
                  <div className="font-medium">{record.booking || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Pool Contract</Label>
                  <div className="font-medium">{record.pool_contract || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Timeline & Status History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Date In</Label>
                    <div className="font-medium">{formatDate(record.date_in)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Date Out</Label>
                    <div className="font-medium">{formatDate(record.date_out)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Days Out</Label>
                    <div className="font-medium">{record.days_out || 'N/A'} days</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Current Status</Label>
                    <div className="mt-1">{getStatusBadge(record.reservation_status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Request Status</Label>
                    <div className="font-medium">{record.request_status || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Logistics */}
          <Card>
            <CardHeader>
              <CardTitle>Location & Logistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm text-muted-foreground">Pick-up Location</Label>
                  <div className="font-medium">{record.pick_up_location || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Location In</Label>
                  <div className="font-medium">{record.location_in || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Region</Label>
                  <div className="font-medium">{record.region || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Market</Label>
                  <div className="font-medium">{record.market || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Internal Management Panel - 1/3 width */}
        <div className="space-y-6">
          {/* Internal Status Control */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-lg">Internal Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                DCLI-only controls and workflow status
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="internal-status">Internal Status</Label>
                    <Select value={internalStatus} onValueChange={setInternalStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Set internal status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ok-to-pay">OK TO PAY</SelectItem>
                        <SelectItem value="emailed-am">EMAILED AM</SelectItem>
                        <SelectItem value="pending-review">PENDING REVIEW</SelectItem>
                        <SelectItem value="escalated">ESCALATED</SelectItem>
                        <SelectItem value="resolved">RESOLVED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="charge-category">Charge Absorption Category</Label>
                    <Select value={chargeCategory} onValueChange={setChargeCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal-operations">Normal Operations</SelectItem>
                        <SelectItem value="customer-caused">Customer Caused</SelectItem>
                        <SelectItem value="force-majeure">Force Majeure</SelectItem>
                        <SelectItem value="dcli-responsibility">DCLI Responsibility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dispute-amount">Dispute Amount</Label>
                    <Input
                      id="dispute-amount"
                      type="number"
                      placeholder="0.00"
                      value={disputeAmount}
                      onChange={(e) => setDisputeAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="internal-notes">Internal Notes</Label>
                    <Textarea
                      id="internal-notes"
                      placeholder="Add internal notes, workflow updates, or reminders..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm text-muted-foreground">Internal Status</Label>
                    <div className="font-medium">{internalStatus || 'Not Set'}</div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Charge Category</Label>
                    <div className="font-medium">{chargeCategory || 'Not Categorized'}</div>
                  </div>
                  
                  {disputeAmount && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Dispute Amount</Label>
                      <div className="font-medium text-red-600">{formatCurrency(disputeAmount)}</div>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Internal Notes</Label>
                    <div className="text-sm mt-1 p-2 bg-muted/50 rounded">
                      {internalNotes || 'No internal notes added'}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                View Audit Trail
              </Button>
            </CardContent>
          </Card>

          {/* Additional Metadata */}
          {record.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm p-2 bg-muted/50 rounded">
                  {record.remarks}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DCLIDetailView;