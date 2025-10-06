import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    tms_match: {
      ld_num: 'LD123456',
      so_num: 'SO789012',
      chassis_number: 'TEMU1234567',
      container_number: 'MSCU9876540', // Different from invoice
      carrier_name: 'ABC Trucking',
      customer_name: 'XYZ Logistics',
      confidence: 85,
      match_reasons: ['Chassis exact match', 'Container partial match']
    }
  };

  const isExactMatch = lineItem.match_confidence === 100;

  const handleValidate = () => {
    toast({
      title: 'Success',
      description: 'Invoice line validated successfully',
    });
    navigate('/vendors/dcli/invoices/new');
  };

  const handleDispute = () => {
    navigate(`/vendors/dcli/invoice-line/${lineId}/dispute`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/vendors/dcli/invoices/new')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Line Details</h1>
          <p className="text-muted-foreground">
            Review and troubleshoot validation
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Line Invoice #</label>
              <p className="text-lg font-mono">{lineItem.line_invoice_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Match Confidence</label>
              <div className="flex items-center gap-2">
                <Badge variant={isExactMatch ? 'default' : 'secondary'}>
                  {lineItem.match_confidence}%
                </Badge>
                {isExactMatch ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isExactMatch && (
        <Card>
          <CardHeader>
            <CardTitle>Mismatch Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <TroubleshootPanel lineItem={lineItem} />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/vendors/dcli/invoices/new')}
        >
          Back
        </Button>
        <Button
          onClick={handleValidate}
          disabled={!isExactMatch}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Validate
        </Button>
        {!isExactMatch && (
          <Button
            onClick={handleDispute}
            variant="destructive"
            className="gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            Dispute
          </Button>
        )}
      </div>
    </div>
  );
};

const TroubleshootPanel = ({ lineItem }: { lineItem: any }) => {
  const checks = [
    {
      title: 'Equipment Verification',
      items: [
        { 
          label: 'Invoice Chassis', 
          value: lineItem.chassis || 'N/A', 
          status: lineItem.tms_match?.chassis_number === lineItem.chassis ? 'match' : 'mismatch' 
        },
        { 
          label: 'TMS Chassis', 
          value: lineItem.tms_match?.chassis_number || 'N/A', 
          status: 'info' 
        },
        { 
          label: 'Invoice Container', 
          value: lineItem.container || 'N/A', 
          status: lineItem.tms_match?.container_number === lineItem.container ? 'match' : 'mismatch' 
        },
        { 
          label: 'TMS Container', 
          value: lineItem.tms_match?.container_number || 'N/A', 
          status: 'info' 
        },
      ]
    },
    {
      title: 'Match Analysis',
      items: [
        { 
          label: 'Confidence Score', 
          value: `${lineItem.match_confidence}%`, 
          status: lineItem.match_confidence === 100 ? 'match' : lineItem.match_confidence >= 60 ? 'warning' : 'mismatch' 
        },
        { 
          label: 'Match Type', 
          value: lineItem.match_type, 
          status: lineItem.match_type === 'exact' ? 'match' : lineItem.match_type === 'fuzzy' ? 'warning' : 'mismatch' 
        },
      ]
    },
    {
      title: 'TMS Data',
      items: [
        { 
          label: 'LD Number', 
          value: lineItem.tms_match?.ld_num || 'Not Found', 
          status: lineItem.tms_match?.ld_num ? 'info' : 'mismatch' 
        },
        { 
          label: 'SO Number', 
          value: lineItem.tms_match?.so_num || 'Not Found', 
          status: lineItem.tms_match?.so_num ? 'info' : 'mismatch' 
        },
        { 
          label: 'Carrier', 
          value: lineItem.tms_match?.carrier_name || 'Not Found', 
          status: lineItem.tms_match?.carrier_name ? 'info' : 'mismatch' 
        },
        { 
          label: 'Customer', 
          value: lineItem.tms_match?.customer_name || 'Not Found', 
          status: lineItem.tms_match?.customer_name ? 'info' : 'mismatch' 
        },
      ]
    }
  ];

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
