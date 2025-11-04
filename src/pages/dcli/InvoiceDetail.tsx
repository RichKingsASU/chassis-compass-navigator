import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle, Play, Eye, FileText, Table as TableIcon, Mail, Image as ImageIcon, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import InvoiceStatusManager from '@/components/dcli/invoice/InvoiceStatusManager';
import LineItemsTable from '@/components/dcli/invoice/LineItemsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { getPublicUrl, formatFileSize, type InvoiceAttachment } from '@/lib/invoiceStorage';

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

  useEffect(() => {
    if (invoice?.summary_invoice_id) {
      document.title = `Invoice ${invoice.summary_invoice_id} - DCLI`;
    }
  }, [invoice]);

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

  const handleView = async (filePath: string) => {
    try {
      const publicUrl = await getPublicUrl(filePath);
      if (publicUrl) {
        window.open(publicUrl, '_blank');
      } else {
        toast.error('Unable to open file for viewing');
      }
    } catch (error: any) {
      console.error('Error viewing file:', error);
      toast.error('Failed to open file for viewing');
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
          {/* Quick access buttons for PDF/Excel */}
          {invoice.attachments && Array.isArray(invoice.attachments) && invoice.attachments.length > 0 ? (
            <>
              {invoice.attachments.some((att: InvoiceAttachment) => att.type === 'pdf') && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const pdfAttachment = invoice.attachments.find((att: InvoiceAttachment) => att.type === 'pdf');
                      if (pdfAttachment) handleView(pdfAttachment.path);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const pdfAttachment = invoice.attachments.find((att: InvoiceAttachment) => att.type === 'pdf');
                      if (pdfAttachment) handleDownload(pdfAttachment.path, pdfAttachment.name);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </>
              )}
              {invoice.attachments.some((att: InvoiceAttachment) => att.type === 'excel') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const excelAttachment = invoice.attachments.find((att: InvoiceAttachment) => att.type === 'excel');
                    if (excelAttachment) handleDownload(excelAttachment.path, excelAttachment.name);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              )}
            </>
          ) : (
            <>
              {invoice.pdf_path && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(invoice.pdf_path!)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(invoice.pdf_path!, `${invoice.summary_invoice_id}.pdf`)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </>
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

      {/* Attachments Section */}
      {invoice.attachments && Array.isArray(invoice.attachments) && invoice.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attachments ({invoice.attachments.length} files)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {invoice.attachments.map((attachment: InvoiceAttachment, index: number) => {
                const getFileIcon = (type: string) => {
                  switch (type) {
                    case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
                    case 'excel': return <TableIcon className="h-5 w-5 text-green-600" />;
                    case 'email': return <Mail className="h-5 w-5 text-blue-500" />;
                    case 'image': return <ImageIcon className="h-5 w-5 text-purple-500" />;
                    case 'document': return <FileText className="h-5 w-5 text-orange-500" />;
                    default: return <File className="h-5 w-5 text-muted-foreground" />;
                  }
                };

                const isViewable = ['pdf', 'image'].includes(attachment.type);

                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(attachment.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{attachment.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="capitalize">{attachment.type}</Badge>
                          <span>{formatFileSize(attachment.size_bytes)}</span>
                          <span>•</span>
                          <span>{new Date(attachment.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isViewable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(attachment.path)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(attachment.path, attachment.name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
            invoiceId={invoiceId}
            returnRoute="detail"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetail;
