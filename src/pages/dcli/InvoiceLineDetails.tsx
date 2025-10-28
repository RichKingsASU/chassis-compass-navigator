import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, CheckCircle, XCircle, AlertTriangle, HelpCircle, Flag, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const InvoiceLineDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lineId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchValidationData = async () => {
      if (!lineId) return;
      
      try {
        setLoading(true);

        // Fetch line item data from staging
        const { data: lineData, error: lineError } = await supabase
          .from('dcli_invoice_line_staging')
          .select('*, staging_invoice_id')
          .eq('line_invoice_number', lineId)
          .single();

        if (lineError) throw lineError;

        // Fetch validation results from staging invoice
        if (lineData?.staging_invoice_id) {
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('dcli_invoice_staging')
            .select('validation_results')
            .eq('id', lineData.staging_invoice_id)
            .single();

          if (invoiceError) throw invoiceError;

          // Find the specific line's validation results
          const validationResults = invoiceData?.validation_results as any;
          const lineValidation = validationResults?.rows?.find(
            (row: any) => row.line_invoice_number === lineId
          );

          setValidationData({
            lineItem: lineData,
            validation: lineValidation || null,
            summary: validationResults?.summary || null
          });
        } else {
          setValidationData({
            lineItem: lineData,
            validation: null,
            summary: null
          });
        }

        // Fetch comments for this line item
        const { data: commentsData, error: commentsError } = await supabase
          .from('dcli_line_comments')
          .select('*')
          .eq('line_invoice_number', lineId)
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;
        setComments(commentsData || []);

      } catch (error: any) {
        console.error('Error fetching validation data:', error);
        toast({
          title: "Error",
          description: "Failed to load line item details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchValidationData();
  }, [lineId, toast]);

  const handleSubmitComment = async () => {
    if (!comment.trim() || !lineId) return;

    setSubmittingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newComment = {
        line_invoice_number: lineId,
        comment: comment.trim(),
        created_by: user?.email || 'Anonymous',
      };

      // Insert into database
      const { data, error } = await supabase
        .from('dcli_line_comments')
        .insert(newComment)
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setComments([data, ...comments]);
      setComment('');

      toast({
        title: "Comment Added",
        description: "Your comment has been saved successfully.",
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const navigateBack = () => {
    // Pass back the navigation state to preserve invoice data
    navigate('/vendors/dcli/invoices/new', { 
      state: location.state,
      replace: false 
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const lineItem = validationData?.lineItem;

  // Mock audit data - replace with real data fetching later
  const auditData = {
    validationChecks: {
      daysUsed: { status: "pass", details: "TMS Used Days (30) matches Invoice Gross Days (30)." },
      billedDay: { status: "pass", details: "Calculated Billed Days (25) matches TMS Rated-Quantity (25)." },
      carrierPaid: { status: "fail", details: "Carrier Paid Amount ($150) does not match Rate (5) * Qty (28) = $140." },
      duplicateCharge: { status: "pass", details: "No exact match found on previous invoices." },
      usageCoverage: { status: "warn", details: "2 days are not covered by LD/SO records." },
      customerContract: { status: "inactive", details: "This check is not activated." },
    },
    infoSections: {
      dispute: { "Dispute #": "D-456", "Status": "Pending", "Reason": "Overcharged", "Amount": "$10.00" },
      credit: { "Credit Provided by EP ($ Amount)": "$0.00" },
      absorption: { "Category": "None" },
      amPaidCarrier: { "Amount": "$150.00", "Rate": "$5.00", "Quantity": "28", "Reason": "Original quote" },
      amBilledCarrier: { "Vendor Credit/Invoice #": "VC-789", "Amount": "$0.00" },
    },
  };

  const ValidationCheck = ({ title, status, details }: { title: string; status: string; details: string }) => {
    const getIcon = () => {
      switch (status) {
        case "pass":
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        case "fail":
          return <XCircle className="h-5 w-5 text-red-500" />;
        case "warn":
          return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        case "inactive":
          return <Flag className="h-5 w-5 text-gray-400" />;
        default:
          return <HelpCircle className="h-5 w-5 text-gray-400" />;
      }
    };
    return (
      <div className="flex items-center space-x-3 mb-3">
        <div>{getIcon()}</div>
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{details}</p>
        </div>
      </div>
    );
  };

  const InfoTab = ({ data }: { data: any }) => {
    return (
      <div className="p-4 border rounded-md bg-muted/50">
        <ul className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <li key={key} className="flex justify-between">
              <span className="text-muted-foreground">{key}:</span>
              <span className="font-medium">{String(value)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={navigateBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Line Item Troubleshooting</h1>
      </div>

      {!validationData || !lineItem ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              No validation data found for this line item. Please validate the invoice first.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Validation Checks */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Validation Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <ValidationCheck title="Days Used Check" {...auditData.validationChecks.daysUsed} />
              <ValidationCheck title="Billed Day Check" {...auditData.validationChecks.billedDay} />
              <ValidationCheck title="Carrier Paid Check" {...auditData.validationChecks.carrierPaid} />
              <ValidationCheck title="Duplicate Charge Check" {...auditData.validationChecks.duplicateCharge} />
              <ValidationCheck title="Usage Coverage Check" {...auditData.validationChecks.usageCoverage} />
              <ValidationCheck title="Customer Contract Check" {...auditData.validationChecks.customerContract} />
            </CardContent>
          </Card>

          {/* Right Column: Line Item Info & Informational Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Line Item Details */}
            <Card>
              <CardHeader>
                <CardTitle>Line Item #{lineId}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Chassis:</span>
                    <p className="font-medium">{lineItem.chassis || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Container:</span>
                    <p className="font-medium">{lineItem.container || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Match Type:</span>
                    <Badge variant={lineItem.match_type === 'exact' ? 'default' : lineItem.match_type === 'fuzzy' ? 'secondary' : 'destructive'}>
                      {lineItem.match_type}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Confidence:</span>
                    <p className="font-medium">{lineItem.match_confidence}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informational Fields Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Informational Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="dispute">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="dispute">Dispute</TabsTrigger>
                    <TabsTrigger value="credit">Credit</TabsTrigger>
                    <TabsTrigger value="absorption">Absorption</TabsTrigger>
                    <TabsTrigger value="paidCarrier">Paid Carrier</TabsTrigger>
                    <TabsTrigger value="billedCarrier">Billed Carrier</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="dispute">
                    <InfoTab data={auditData.infoSections.dispute} />
                  </TabsContent>
                  <TabsContent value="credit">
                    <InfoTab data={auditData.infoSections.credit} />
                  </TabsContent>
                  <TabsContent value="absorption">
                    <InfoTab data={auditData.infoSections.absorption} />
                  </TabsContent>
                  <TabsContent value="paidCarrier">
                    <InfoTab data={auditData.infoSections.amPaidCarrier} />
                  </TabsContent>
                  <TabsContent value="billedCarrier">
                    <InfoTab data={auditData.infoSections.amBilledCarrier} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle>Comments & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment or note about this line item..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmitComment}
                      disabled={!comment.trim() || submittingComment}
                      size="sm"
                    >
                      {submittingComment ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Post Comment
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3 mt-6">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No comments yet. Be the first to add a note!
                    </div>
                  ) : (
                    comments.map((c, idx) => (
                      <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">{c.created_by}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceLineDetails;
