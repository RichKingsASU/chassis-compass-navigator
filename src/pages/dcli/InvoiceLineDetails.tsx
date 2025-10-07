import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, AlertTriangle, FileText, DollarSign, Calendar, Package, Users, Save } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Validation Categories Configuration
type ValidationStatus = 'pass' | 'fail' | 'warning' | 'info';

interface ValidationCategory {
  id: string;
  label: string;
  icon: typeof CheckCircle;
  status: ValidationStatus;
  message: string;
}

const getStatusConfig = (status: ValidationStatus) => {
  const configs = {
    pass: { 
      icon: CheckCircle, 
      colorClass: 'text-green-600 dark:text-green-400',
      bgClass: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900'
    },
    fail: { 
      icon: XCircle, 
      colorClass: 'text-red-600 dark:text-red-400',
      bgClass: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
    },
    warning: { 
      icon: AlertTriangle, 
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
    },
    info: { 
      icon: AlertCircle, 
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
    }
  };
  return configs[status];
};

const InvoiceLineDetails = () => {
  const { lineId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock data - replace with actual data fetching
  const lineItem = {
    line_invoice_number: lineId || '',
    chassis: 'TEMU1234567',
    container: 'MSCU9876543',
    match_confidence: 85,
    match_type: 'fuzzy',
    invoice_date: '2024-01-15',
    billing_start: '2024-01-10',
    billing_end: '2024-01-20',
    total_charges: 450.00,
    invoice_rate: 45.00,
    invoice_quantity: 10,
    charge_type: 'Chassis Charge',
    tms_match: {
      ld_num: 'LD123456',
      so_num: 'SO789012',
      chassis_number: 'TEMU1234567',
      container_number: 'MSCU9876540', // Different from invoice
      carrier_name: 'ABC Trucking',
      customer_name: 'XYZ Logistics',
      date_out: '2024-01-10',
      date_in: '2024-01-20',
      calculated_charges: 420.00,
      rated_amount: 420.00,
      rated_rate: 42.00,
      rated_quantity: 10,
      confidence: 85,
      match_reasons: ['Chassis exact match', 'Container partial match'],
      multi_load: false,
      special_contract: false
    }
  };

  const isExactMatch = lineItem.match_confidence === 100;

  // Validation Categories - Configurable
  const validationCategories: ValidationCategory[] = [
    {
      id: 'equipment',
      label: 'Equipment Match',
      icon: Package,
      status: lineItem.tms_match.container_number === lineItem.container ? 'pass' : 'fail',
      message: lineItem.tms_match.container_number === lineItem.container 
        ? 'Chassis and container match TMS data' 
        : 'Container mismatch detected'
    },
    {
      id: 'dates',
      label: 'Date Verification',
      icon: Calendar,
      status: lineItem.invoice_date === lineItem.tms_match.date_out ? 'pass' : 'warning',
      message: lineItem.invoice_date === lineItem.tms_match.date_out 
        ? 'Billing dates align with TMS' 
        : 'Date discrepancies found'
    },
    {
      id: 'charges',
      label: 'Charges Match',
      icon: DollarSign,
      status: lineItem.total_charges === lineItem.tms_match.calculated_charges ? 'pass' : 'fail',
      message: lineItem.total_charges === lineItem.tms_match.calculated_charges 
        ? 'Charges match calculated amount' 
        : `Difference: $${Math.abs(lineItem.total_charges - lineItem.tms_match.calculated_charges).toFixed(2)}`
    },
    {
      id: 'multi_load',
      label: 'Multi-Load Check',
      icon: Users,
      status: lineItem.tms_match.multi_load ? 'warning' : 'pass',
      message: lineItem.tms_match.multi_load 
        ? 'Multiple loads found for this equipment' 
        : 'Single load confirmed'
    },
    {
      id: 'special_contract',
      label: 'Special Contract',
      icon: FileText,
      status: lineItem.tms_match.special_contract ? 'info' : 'pass',
      message: lineItem.tms_match.special_contract 
        ? 'Special contract terms apply' 
        : 'Standard contract terms'
    },
    {
      id: 'tms_result',
      label: 'TMS Data Found',
      icon: CheckCircle,
      status: lineItem.tms_match ? 'pass' : 'fail',
      message: lineItem.tms_match 
        ? `Found in TMS (LD: ${lineItem.tms_match.ld_num})` 
        : 'No matching TMS record found'
    }
  ];

  const handleValidate = () => {
    toast({
      title: 'Success',
      description: 'Invoice line validated successfully',
    });
    navigateBack();
  };

  const handleSave = () => {
    toast({
      title: 'Saved',
      description: 'Invoice line details saved successfully',
    });
  };

  const handleDispute = () => {
    navigate(`/vendors/dcli/invoice-line/${lineId}/dispute`);
  };
  
  const navigateBack = () => {
    const location = window.history.state?.usr;
    navigate('/vendors/dcli/invoices/new', { 
      state: location || {},
      replace: false
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={navigateBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Invoice Line Validation</h1>
          <p className="text-muted-foreground">
            Line Invoice #{lineItem.line_invoice_number}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Match Confidence</p>
            <div className="flex items-center gap-2 justify-end">
              <Badge variant={isExactMatch ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                {lineItem.match_confidence}%
              </Badge>
              {isExactMatch ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Validation Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validationCategories.map((category) => {
              const config = getStatusConfig(category.status);
              const StatusIcon = config.icon;
              
              return (
                <Card key={category.id} className={`border-2 ${config.bgClass}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-background`}>
                        <StatusIcon className={`h-5 w-5 ${config.colorClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-1">{category.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {category.message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      {!isExactMatch && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analysis - Issues Requiring Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <TroubleshootPanel 
              lineItem={lineItem} 
              validationCategories={validationCategories.filter(cat => cat.status !== 'pass')}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4 items-center sticky bottom-6 bg-background/95 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
        <Button
          variant="outline"
          onClick={navigateBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Review
        </Button>
        <div className="flex-1" />
        <Button
          onClick={handleSave}
          variant="outline"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
        <Button
          onClick={handleValidate}
          disabled={!isExactMatch}
          className="gap-2"
          variant={isExactMatch ? "default" : "secondary"}
        >
          <CheckCircle className="h-4 w-4" />
          Validate Line
        </Button>
        <Button
          onClick={handleDispute}
          variant="destructive"
          className="gap-2"
          disabled={isExactMatch}
        >
          <AlertCircle className="h-4 w-4" />
          Open Dispute
        </Button>
      </div>
    </div>
  );
};

const TroubleshootPanel = ({ lineItem, validationCategories }: { lineItem: any; validationCategories: ValidationCategory[] }) => {
  const categoryDetailsMap: Record<string, any> = {
    equipment: {
      title: 'Equipment Mismatch Details',
      items: [
        { label: 'Invoice Chassis', value: lineItem.chassis || 'N/A', status: 'info' },
        { label: 'TMS Chassis', value: lineItem.tms_match?.chassis_number || 'N/A', status: 'info' },
        { label: 'Invoice Container', value: lineItem.container || 'N/A', status: 'mismatch' },
        { label: 'TMS Container', value: lineItem.tms_match?.container_number || 'N/A', status: 'mismatch' },
      ]
    },
    dates: {
      title: 'Date Mismatch Details',
      items: [
        { label: 'Invoice Date', value: lineItem.invoice_date || 'N/A', status: 'mismatch' },
        { label: 'TMS Date Out', value: lineItem.tms_match?.date_out || 'N/A', status: 'info' },
        { label: 'Billing Start', value: lineItem.billing_start || 'N/A', status: 'info' },
        { label: 'Billing End', value: lineItem.billing_end || 'N/A', status: 'info' },
      ]
    },
    charges: {
      title: 'Charges Mismatch Details',
      items: [
        { label: 'Charge Type', value: lineItem.charge_type || 'N/A', status: 'info' },
        { label: 'Rated-Amount', value: `$${lineItem.tms_match?.rated_amount?.toFixed(2) || '0.00'}`, status: 'info' },
        { label: 'Rated-Rate', value: `$${lineItem.tms_match?.rated_rate?.toFixed(2) || '0.00'}`, status: 'info' },
        { label: 'Rated-Quantity', value: lineItem.tms_match?.rated_quantity || '0', status: 'info' },
        { label: 'Invoice-Amount', value: `$${lineItem.total_charges?.toFixed(2) || '0.00'}`, status: 'mismatch' },
        { label: 'Invoice-Rate', value: `$${lineItem.invoice_rate?.toFixed(2) || '0.00'}`, status: 'mismatch' },
        { label: 'Invoice-Quantity', value: lineItem.invoice_quantity || '0', status: 'mismatch' },
        { label: 'Difference', value: `$${Math.abs((lineItem.total_charges || 0) - (lineItem.tms_match?.rated_amount || 0)).toFixed(2)}`, status: 'warning' },
      ]
    },
    multi_load: {
      title: 'Multi-Load Analysis',
      items: [
        { label: 'Multiple Loads Detected', value: lineItem.tms_match?.multi_load ? 'Yes' : 'No', status: 'warning' },
        { label: 'Chassis Number', value: lineItem.chassis || 'N/A', status: 'info' },
        { label: 'Review Required', value: 'Manual verification needed', status: 'warning' },
      ]
    },
    special_contract: {
      title: 'Special Contract Information',
      items: [
        { label: 'Contract Type', value: 'Special Terms Apply', status: 'info' },
        { label: 'Customer', value: lineItem.tms_match?.customer_name || 'N/A', status: 'info' },
        { label: 'Review Required', value: 'Verify special pricing', status: 'info' },
      ]
    },
    tms_result: {
      title: 'TMS Match Failure',
      items: [
        { label: 'LD Number', value: lineItem.tms_match?.ld_num || 'Not Found', status: 'mismatch' },
        { label: 'SO Number', value: lineItem.tms_match?.so_num || 'Not Found', status: 'mismatch' },
        { label: 'Chassis', value: lineItem.chassis || 'N/A', status: 'info' },
        { label: 'Container', value: lineItem.container || 'N/A', status: 'info' },
      ]
    }
  };

  const checks = validationCategories
    .filter(cat => categoryDetailsMap[cat.id])
    .map(cat => categoryDetailsMap[cat.id]);

  const getStatusColor = (status: string) => {
    if (status === 'match') return 'text-green-600';
    if (status === 'warning') return 'text-yellow-600';
    if (status === 'mismatch') return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      {checks.map((check, index) => (
        <CheckSection key={index} check={check} getStatusColor={getStatusColor} />
      ))}
    </div>
  );
};

const CheckSection = ({ check, getStatusColor }: { check: any; getStatusColor: (status: string) => string }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{check.title}</CardTitle>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {check.items.map((item: any, itemIndex: number) => (
                <div key={itemIndex} className="flex justify-between text-sm py-2 border-b last:border-0">
                  <span className="font-medium">{item.label}:</span>
                  <span className={getStatusColor(item.status)}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default InvoiceLineDetails;
