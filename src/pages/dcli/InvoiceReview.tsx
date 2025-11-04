import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, Mail, MessageSquare, User, Clock } from 'lucide-react';
import ValidationDrawer from '@/components/dcli/invoice/ValidationDrawer';
import LineItemsTable from '@/components/dcli/invoice/LineItemsTable';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  type: 'comment' | 'email';
}

interface InvoiceData {
  summary_invoice_id: string;
  billing_date: string;
  due_date: string;
  status: string;
  line_items: any[];
  attachments: any[];
}

const InvoiceReview = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [selectedLines, setSelectedLines] = useState<number[]>([]);

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceData();
      loadComments();
    }
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      
      // Check if invoiceId is a UUID (staging_invoice_id) or invoice number (summary_invoice_id)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId || '');
      
      // Try staging table
      const { data: stagingData, error: stagingError } = await supabase
        .from('dcli_invoice_staging' as any)
        .select('*')
        .eq(isUUID ? 'id' : 'summary_invoice_id', invoiceId)
        .maybeSingle();

      if (stagingData && !stagingError) {
        // Fetch line items for staging invoice
        const { data: lineItems } = await supabase
          .from('dcli_invoice_line_staging' as any)
          .select('*')
          .eq('staging_invoice_id', (stagingData as any).id);
        
        const fullStagingData: InvoiceData = {
          summary_invoice_id: (stagingData as any).summary_invoice_id || (stagingData as any).id || '',
          billing_date: (stagingData as any).billing_date || '',
          due_date: (stagingData as any).due_date || '',
          status: (stagingData as any).status || 'pending',
          line_items: lineItems || [],
          attachments: (stagingData as any).attachments || []
        };
        
        setInvoiceData(fullStagingData);
        await runValidation(fullStagingData);
      } else {
        // Try main invoice table
        const { data: invoiceHeader, error: invoiceError } = await supabase
          .from('dcli_invoice' as any)
          .select('*')
          .eq('invoice_id', invoiceId)
          .maybeSingle();

        if (invoiceError) throw invoiceError;
        if (!invoiceHeader) throw new Error('Invoice not found');

        // Get line items
        const { data: lineItems, error: lineItemsError } = await supabase
          .from('dcli_invoice_line_item' as any)
          .select('*')
          .eq('summary_invoice_id', invoiceId);

        if (lineItemsError) throw lineItemsError;

        const fullData: InvoiceData = {
          summary_invoice_id: (invoiceHeader as any).invoice_id || invoiceId || '',
          billing_date: (invoiceHeader as any).billing_date || (invoiceHeader as any).invoice_date || '',
          due_date: (invoiceHeader as any).due_date || '',
          status: (invoiceHeader as any).status || 'pending',
          line_items: lineItems || [],
          attachments: []
        };

        setInvoiceData(fullData);
        await runValidation(fullData);
      }
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

  const runValidation = async (data: InvoiceData) => {
    try {
      const { data: validationData, error } = await supabase.rpc('validate_dcli_invoice' as any, {
        p_summary_invoice_id: data.summary_invoice_id,
        p_account_code: '',
        p_billing_date: data.billing_date,
        p_due_date: data.due_date,
        p_line_items: data.line_items as any,
      });

      if (error) throw error;
      setValidationResult(validationData);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const loadComments = async () => {
    // Mock comments - you can store these in a separate table
    setComments([
      {
        id: '1',
        content: 'Initial review completed. Found 3 mismatches that need attention.',
        created_at: new Date().toISOString(),
        created_by: 'john.doe@example.com',
        type: 'comment'
      }
    ]);
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

  if (!invoiceData) {
    return (
      <div className="p-8">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button onClick={() => navigate('/vendors/dcli')} className="mt-4">
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
          <Button variant="ghost" onClick={() => navigate('/vendors/dcli')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Invoice Review</h1>
            <p className="text-muted-foreground">
              Invoice #{invoiceData.summary_invoice_id || invoiceId}
            </p>
          </div>
        </div>
        <Badge variant={invoiceData.status === 'submitted' ? 'default' : 'secondary'}>
          {invoiceData.status}
        </Badge>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Validation Results</h2>
          <ValidationDrawer validationResult={validationResult} />
        </Card>
      )}

      {/* Line Items Table */}
      {invoiceData.line_items && invoiceData.line_items.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            Line Items ({invoiceData.line_items.length})
          </h2>
          <LineItemsTable 
            data={invoiceData.line_items}
            selectedLines={selectedLines}
            invoiceId={invoiceId}
            onSelectionChange={setSelectedLines}
          />
        </Card>
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
