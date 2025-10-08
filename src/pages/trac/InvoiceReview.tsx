import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import ExcelDataTable from '@/components/ccm/invoice/ExcelDataTable';
import { ExcelDataItem } from '@/components/ccm/invoice/types';

const InvoiceReview = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<ExcelDataItem[]>([]);
  
  // Form fields
  const [summaryInvoiceId, setSummaryInvoiceId] = useState('');
  const [billingDate, setBillingDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billingTerms, setBillingTerms] = useState('Net 30');
  const [vendor, setVendor] = useState('TRAC');
  const [amountDue, setAmountDue] = useState('');
  const [status, setStatus] = useState('pending');
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceData();
    }
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      
      const { data: invoiceHeader, error: invoiceError } = await supabase
        .from('trac_invoice')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceHeader);
      
      // Populate form fields
      setSummaryInvoiceId(invoiceHeader.invoice_number);
      setBillingDate(invoiceHeader.invoice_date);
      setDueDate(invoiceHeader.due_date);
      setAmountDue(invoiceHeader.total_amount_usd?.toString() || '0');
      setStatus(invoiceHeader.status || 'pending');

      const { data: lineData, error: dataError } = await supabase
        .from('trac_invoice_data')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (dataError) throw dataError;
      
      const transformedData: ExcelDataItem[] = (lineData || []).map(item => ({
        id: item.id,
        invoice_id: item.invoice_id,
        sheet_name: item.sheet_name,
        row_data: item.row_data as Record<string, any>,
        created_at: item.created_at,
        validated: item.validated,
        column_headers: Array.isArray(item.column_headers) ? item.column_headers as string[] : undefined
      }));
      
      setInvoiceData(transformedData);
    } catch (error: any) {
      console.error('Error loading invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadInvoiceData();
  };

  const countLineItems = () => {
    const total = invoiceData.length;
    const validated = invoiceData.filter(item => item.validated).length;
    const pending = total - validated;
    return { total, validated, pending };
  };

  const { total, validated, pending } = countLineItems();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button onClick={() => navigate('/vendors/trac')} className="mt-4">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/vendors/trac')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoice Tracker
          </Button>
          <h1 className="text-3xl font-bold">New Invoice</h1>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Step 1 - Upload */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="font-semibold">Upload</div>
                <div className="text-xs text-muted-foreground">PDF + Excel</div>
              </div>
            </div>
            <div className="flex-1 h-1 bg-primary -mx-2" />
            
            {/* Step 2 - Review (Current) */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-2 font-bold">
                2
              </div>
              <div className="text-center">
                <div className="font-semibold">Review</div>
                <div className="text-xs text-muted-foreground">Prefill & Edit</div>
              </div>
            </div>
            <div className="flex-1 h-1 bg-muted -mx-2" />
            
            {/* Step 3 - Validate */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-2">
                3
              </div>
              <div className="text-center">
                <div className="font-semibold text-muted-foreground">Validate</div>
                <div className="text-xs text-muted-foreground">Match Data</div>
              </div>
            </div>
            <div className="flex-1 h-1 bg-muted -mx-2" />
            
            {/* Step 4 - Submit */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-2">
                4
              </div>
              <div className="text-center">
                <div className="font-semibold text-muted-foreground">Submit</div>
                <div className="text-xs text-muted-foreground">Review & Submit</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Header</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="summary-invoice-id">Summary Invoice ID</Label>
                    <Input
                      id="summary-invoice-id"
                      value={summaryInvoiceId}
                      onChange={(e) => setSummaryInvoiceId(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing-date">Billing Date</Label>
                    <Input
                      id="billing-date"
                      type="date"
                      value={billingDate}
                      onChange={(e) => setBillingDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing-terms">Billing Terms</Label>
                    <Input
                      id="billing-terms"
                      value={billingTerms}
                      onChange={(e) => setBillingTerms(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor">Vendor</Label>
                    <Select value={vendor} onValueChange={setVendor}>
                      <SelectTrigger id="vendor">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRAC">TRAC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount-due">Amount Due</Label>
                    <Input
                      id="amount-due"
                      type="number"
                      step="0.01"
                      value={amountDue}
                      onChange={(e) => setAmountDue(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Open</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.file_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{invoice.file_name}</span>
                      <span className="text-muted-foreground">{invoice.file_path}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Line Items Table */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Line Items - Full Data Review ({total})
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Review all extracted data from the Excel file. Scroll horizontally to see all columns.
              </p>
              {invoiceData.length > 0 && (
                <ExcelDataTable 
                  data={invoiceData} 
                  loading={loading}
                  invoiceId={invoiceId}
                  onRefresh={handleRefresh}
                />
              )}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Invoice ID</div>
                  <div className="text-2xl font-bold">{summaryInvoiceId}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-1">$ Amount Due</div>
                  <div className="text-2xl font-bold">${Number(amountDue).toLocaleString()}</div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-semibold mb-3">Line Items</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Count</span>
                      <span className="font-semibold">{total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Open</span>
                      <Badge variant="default" className="bg-blue-500">{pending}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Closed</span>
                      <Badge variant="default" className="bg-green-500">{validated}</Badge>
                    </div>
                  </div>
                </div>

                {invoice.file_name && (
                  <div className="border-t pt-4">
                    <div className="text-sm font-semibold mb-3">Attachments</div>
                    <div className="space-y-2 text-sm">
                      <div>{invoice.file_name.replace('.pdf', '.pdf')}</div>
                      <div>{invoice.file_name.replace('.pdf', '.xlsx')}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full">
                Back to Upload
              </Button>
              <Button variant="outline" className="w-full">
                Save Draft
              </Button>
              <Button className="w-full">
                Continue to Validate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceReview;