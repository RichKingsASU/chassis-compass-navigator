import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, CheckCircle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import InvoiceStatusManager from '@/components/dcli/invoice/InvoiceStatusManager';
import LineItemsTable from '@/components/dcli/invoice/LineItemsTable';
import { Skeleton } from '@/components/ui/skeleton';

interface InvoiceHeader {
  id: string;
  summary_invoice_id: string;
  billing_date: string;
  due_date: string;
  amount_due: number;
  pool: string;
  account_code: string;
  billing_terms: string;
  validation_status: string;
  status: string;
  pdf_path: string | null;
  excel_path: string | null;
  attachments: any;
  validation_results: any;
  created_at: string;
}

interface LineItem {
  id: number;
  staging_invoice_id: string;
  line_invoice_number: string;
  chassis_out: string;
  container_in: string;
  container_out: string;
  date_in: string;
  date_out: string;
  invoice_total: number;
  invoice_status: string;
  dispute_status: string;
  tms_match_confidence: number | null;
  tms_match_type: string | null;
  validation_issues: any;
  attachment_count: number;
}

const InvoiceDetail = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceHeader | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedLines, setSelectedLines] = useState<number[]>([]);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId]);

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      // Fetch invoice header
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('dcli_invoice_staging')
        .select('*')
        .eq('id', invoiceId)
        .maybeSingle();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Fetch line items
      const { data: linesData, error: linesError } = await supabase
        .from('dcli_invoice_line_staging')
        .select('*')
        .eq('staging_invoice_id', invoiceData.id)
        .order('line_index', { ascending: true });

      if (linesError) throw linesError;
      setLineItems(linesData || []);
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string, validationStatus: string) => {
    if (!invoice) return;

    try {
      const { error } = await supabase
        .from('dcli_invoice_staging')
        .update({
          status,
          validation_status: validationStatus,
        })
        .eq('id', invoice.id);

      if (error) throw error;

      setInvoice({ ...invoice, status, validation_status: validationStatus });
      toast.success('Status updated successfully');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDownload = async (path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('invoices')
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleRunValidation = async () => {
    if (!invoice) return;

    toast.info('Validation started...');
    try {
      // Update status to in_progress
      await supabase
        .from('dcli_invoice_staging')
        .update({ validation_status: 'in_progress' })
        .eq('id', invoice.id);

      // TODO: Call edge function for TMS matching
      // For now, just simulate completion
      setTimeout(async () => {
        await supabase
          .from('dcli_invoice_staging')
          .update({ validation_status: 'completed' })
          .eq('id', invoice.id);
        
        toast.success('Validation completed');
        fetchInvoiceData();
      }, 2000);
    } catch (error: any) {
      console.error('Error running validation:', error);
      toast.error('Failed to run validation');
    }
  };

  const handleApprove = async () => {
    if (!invoice) return;

    try {
      const { error } = await supabase
        .from('dcli_invoice_staging')
        .update({ status: 'approved' })
        .eq('id', invoice.id);

      if (error) throw error;

      toast.success('Invoice approved');
      fetchInvoiceData();
    } catch (error: any) {
      console.error('Error approving invoice:', error);
      toast.error('Failed to approve invoice');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vendors/dcli')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Invoice not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vendors/dcli')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Invoice {invoice.summary_invoice_id}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Show all attachments if available */}
          {invoice.attachments && Array.isArray(invoice.attachments) && invoice.attachments.length > 0 ? (
            invoice.attachments.map((attachment: any, idx: number) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleDownload(attachment.path, attachment.name)}
                title={attachment.name}
              >
                <Download className="h-4 w-4 mr-2" />
                {attachment.name}
              </Button>
            ))
          ) : (
            <>
              {invoice.pdf_path && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(invoice.pdf_path!, `${invoice.summary_invoice_id}.pdf`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
              {invoice.excel_path && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(invoice.excel_path!, `${invoice.summary_invoice_id}.xlsx`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              )}
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleRunValidation}>
            <Play className="h-4 w-4 mr-2" />
            Run Validation
          </Button>
          <Button size="sm" onClick={handleApprove}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      </div>

      {/* Invoice Header Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Billing Date</p>
              <p className="font-medium">{new Date(invoice.billing_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="font-medium text-lg">${invoice.amount_due.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pool</p>
              <p className="font-medium">{invoice.pool || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Code</p>
              <p className="font-medium">{invoice.account_code || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Billing Terms</p>
              <p className="font-medium">{invoice.billing_terms || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Line Items</p>
              <p className="font-medium">{lineItems.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(invoice.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <InvoiceStatusManager
              currentStatus={invoice.status}
              currentValidationStatus={invoice.validation_status}
              onSave={handleStatusUpdate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items ({lineItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LineItemsTable
            data={lineItems}
            selectedLines={selectedLines}
            onSelectionChange={setSelectedLines}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetail;
