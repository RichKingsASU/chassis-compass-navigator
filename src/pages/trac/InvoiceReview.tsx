import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, Mail, MessageSquare, User, Clock } from 'lucide-react';
import ExcelDataTable from '@/components/ccm/invoice/ExcelDataTable';
import { ExcelDataItem } from '@/components/ccm/invoice/types';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  type: 'comment' | 'email';
}

const InvoiceReview = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<ExcelDataItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceData();
      loadComments();
    }
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      
      // Load invoice header
      const { data: invoiceHeader, error: invoiceError } = await supabase
        .from('trac_invoice')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceHeader);

      // Load invoice data
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

  const loadComments = async () => {
    // Mock comments - you can store these in a separate table
    setComments([]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      created_at: new Date().toISOString(),
      created_by: user?.email || 'unknown',
      type: 'comment'
    };

    setComments([...comments, comment]);
    setNewComment('');
    
    toast({
      title: 'Comment Added',
      description: 'Your comment has been saved',
    });
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both subject and body',
        variant: 'destructive',
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const emailComment: Comment = {
      id: Date.now().toString(),
      content: `Email: ${emailSubject}\n\n${emailBody}`,
      created_at: new Date().toISOString(),
      created_by: user?.email || 'unknown',
      type: 'email'
    };

    setComments([...comments, emailComment]);
    setEmailSubject('');
    setEmailBody('');
    setShowEmailForm(false);
    
    toast({
      title: 'Email Thread Saved',
      description: 'Email thread has been documented',
    });
  };

  const handleRefresh = async () => {
    await loadInvoiceData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/vendors/trac')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Invoice Review</h1>
            <p className="text-muted-foreground">Invoice #{invoice.invoice_number}</p>
          </div>
        </div>
        <Badge variant={invoice.status === 'approved' ? 'default' : 'secondary'}>
          {invoice.status}
        </Badge>
      </div>

      {/* Invoice Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-medium">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invoice Date</p>
              <p className="font-medium">{invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium">${Number(invoice.total_amount_usd || 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Excel Data Table */}
      {invoiceData.length > 0 && (
        <ExcelDataTable 
          data={invoiceData} 
          loading={loading}
          invoiceId={invoiceId}
          onRefresh={handleRefresh}
        />
      )}

      {/* Comments and Email Threads Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Comments & Email Threads</h2>
          <Button variant="outline" onClick={() => setShowEmailForm(!showEmailForm)}>
            <Mail className="w-4 h-4 mr-2" />
            {showEmailForm ? 'Add Comment' : 'Add Email Thread'}
          </Button>
        </div>

        {/* Email Form */}
        {showEmailForm ? (
          <Card className="p-4 mb-6 bg-muted/50">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-subject">Email Subject</Label>
                <Input
                  id="email-subject"
                  placeholder="Enter email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email-body">Email Body</Label>
                <Textarea
                  id="email-body"
                  placeholder="Paste email content here..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={6}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEmailForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendEmail}>
                  <Send className="w-4 h-4 mr-2" />
                  Save Email Thread
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Comment Form */
          <Card className="p-4 mb-6 bg-muted/50">
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-comment">Add Comment</Label>
                <Textarea
                  id="new-comment"
                  placeholder="Document decisions, findings, or notes about this invoice..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Separator className="my-6" />

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments or email threads yet. Add one to start documenting this invoice.
            </div>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${comment.type === 'email' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {comment.type === 'email' ? (
                      <Mail className="w-4 h-4 text-blue-600" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{comment.created_by}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                      {comment.type === 'email' && (
                        <Badge variant="outline" className="ml-2">Email Thread</Badge>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{comment.content}</div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default InvoiceReview;