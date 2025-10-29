import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, CheckCircle, XCircle, AlertTriangle, FileText, Clock, Mail, Send, Paperclip, Upload, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type ActionType = 'dispute' | 'credit' | 'absorption' | 'vendor-credit' | null;

const InvoiceLineDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lineId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState<any>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [selectedCheck, setSelectedCheck] = useState<any>(null);
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideComment, setOverrideComment] = useState("");
  const [overrideFile, setOverrideFile] = useState<File | null>(null);

  useEffect(() => {
    if (invoiceNumber && location.pathname.includes('/invoice-line/')) {
      navigate(location.pathname, { state: { invoiceNumber }, replace: true });
    }
  }, [invoiceNumber, location.pathname, navigate]);

  useEffect(() => {
    const fetchValidationData = async () => {
      if (!lineId) return;
      
      try {
        setLoading(true);

        const { data: lineData, error: lineError } = await supabase
          .from('dcli_invoice_line_staging')
          .select('*, staging_invoice_id')
          .eq('line_invoice_number', lineId)
          .single();

        if (lineError) throw lineError;

        if (lineData?.staging_invoice_id) {
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('dcli_invoice_staging')
            .select('validation_results, summary_invoice_id')
            .eq('id', lineData.staging_invoice_id)
            .single();

          if (invoiceError) throw invoiceError;

          if (invoiceData?.summary_invoice_id) {
            setInvoiceNumber(invoiceData.summary_invoice_id);
          }

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

      const { data, error } = await supabase
        .from('dcli_line_comments')
        .insert(newComment)
        .select()
        .single();

      if (error) throw error;

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

  const openDrawer = (action: ActionType) => {
    setActiveAction(action);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setActiveAction(null);
  };

  const navigateBack = () => {
    if (validationData?.lineItem?.staging_invoice_id) {
      navigate(`/vendors/dcli/invoices/${validationData.lineItem.staging_invoice_id}/review`, { 
        replace: false 
      });
    } else {
      navigate('/vendors/dcli', { replace: false });
    }
  };

  const handleCheckClick = (check: any) => {
    setSelectedCheck(check);
    setOverrideStatus(check.overrideStatus || "");
    setOverrideComment("");
    setOverrideFile(null);
    setCheckDialogOpen(true);
  };

  const handleSaveOverride = async () => {
    // TODO: Save override to database
    toast({
      title: "Override Saved",
      description: "Validation check override has been saved successfully.",
    });
    setCheckDialogOpen(false);
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

  const validationChecks = [
    {
      id: 'days-used',
      title: "Days Used Check",
      status: "pass",
      summary: "TMS duration matches invoice duration.",
      data: [
        { label: "TMS Dates (30d)", value: "10/01 - 10/30" },
        { label: "Invoice Dates (30d)", value: "10/01 - 10/30" }
      ],
      logic: "Compares the start and end dates from TMS records against the invoice billing period to ensure they align.",
      overrideOptions: ['Mark as Pass', 'Mark as Fail', 'Ignore This Check']
    },
    {
      id: 'billed-days',
      title: "Billed Days Check",
      status: "pass",
      summary: "TMS quantity matches invoice quantity.",
      data: [
        { label: "TMS Billed Qty", value: "25 Days" },
        { label: "Invoice Billed Qty", value: "25 Days" }
      ],
      logic: "Validates that the number of days billed on the invoice matches the calculated days from TMS records.",
      overrideOptions: ['Mark as Pass', 'Mark as Fail', 'Ignore This Check']
    },
    {
      id: 'carrier-paid',
      title: "Carrier Paid Check",
      status: "fail",
      summary: "Amount paid ($150) does not match Rate (5) * Qty (28) = $140.",
      data: [
        { label: "TMS Days", value: "28" },
        { label: "TMS Rate", value: "$5.00" },
        { label: "TMS Paid Amount", value: "$150.00", highlight: true }
      ],
      logic: "Verifies that the amount paid to carrier (TMS) matches the expected calculation: Rate × Quantity. A mismatch may indicate overbilling or a rate discrepancy.",
      overrideOptions: ['Accept Discrepancy', 'Mark as Pass', 'Ignore This Check']
    },
    {
      id: 'duplicate-charge',
      title: "Duplicate Charge Check",
      status: "pass",
      summary: "No exact duplicates found on previous invoices.",
      data: [
        { label: "Overlapping Dates", value: "None" }
      ],
      logic: "Searches historical invoices for identical charges (same chassis, container, dates) to prevent double-billing.",
      overrideOptions: ['Mark as Pass', 'Mark as Fail', 'Ignore This Check']
    },
    {
      id: 'usage-coverage',
      title: "Usage Coverage Check",
      status: "warn",
      summary: "2 days of invoice period are not covered by TMS LD/SO records.",
      data: [
        { label: "Uncovered Days", value: "2", highlight: true },
        { label: "Uncovered Dates", value: "10/14, 10/28" }
      ],
      logic: "Cross-references invoice billing dates against TMS shipment records to ensure every billed day has corresponding usage documentation.",
      overrideOptions: ['Accept Gap', 'Mark as Pass', 'Ignore This Check']
    },
    {
      id: 'customer-contract',
      title: "Customer Contract Check",
      status: "inactive",
      summary: "This check is not activated for this customer.",
      data: [
        { label: "Status", value: "Inactive" }
      ],
      logic: "Validates invoice rates against customer contract terms. Currently disabled for this customer.",
      overrideOptions: ['Enable Check', 'Keep Inactive']
    }
  ];

  const activityHistory = [
    {
      icon: <Clock className="h-5 w-5 text-white" />,
      iconBg: "bg-muted",
      text: "Status changed to",
      highlight: "Needs Review",
      timestamp: "Oct 28, 2:03 PM"
    },
    {
      icon: <Mail className="h-5 w-5 text-white" />,
      iconBg: "bg-primary",
      text: "Line item ingested from",
      highlight: "Invoice #1043381",
      timestamp: "Oct 28, 1:59 PM"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Button variant="ghost" size="sm" onClick={navigateBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Invoice #{invoiceNumber || 'Loading...'}
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Line Item Audit: #{lineId}</h1>
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
        <>
          {/* Section 1: At-a-Glance Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Chassis</dt>
                  <dd className="mt-1 text-sm font-semibold">{lineItem.chassis || 'APMZ704640'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Container</dt>
                  <dd className="mt-1 text-sm font-semibold">{lineItem.container || 'OTPU6553230'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Customer</dt>
                  <dd className="mt-1 text-sm font-semibold">{validationData?.validation?.tms_match?.customer_name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Account Manager</dt>
                  <dd className="mt-1 text-sm font-semibold">{validationData?.validation?.tms_match?.acct_mg_name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Confidence</dt>
                  <dd className="mt-1">
                    <Badge variant="destructive">{lineItem.match_confidence || 0}%</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Current Status</dt>
                  <dd className="mt-1">
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Needs Review</Badge>
                  </dd>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Take Action Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-base font-semibold">Take Action:</span>
                <Button onClick={() => openDrawer('dispute')}>Add Dispute</Button>
                <Button variant="outline" onClick={() => openDrawer('credit')}>Add Credit</Button>
                <Button variant="outline" onClick={() => openDrawer('absorption')}>Add Absorption</Button>
                <Button variant="outline" onClick={() => openDrawer('vendor-credit')}>Add Vendor Credit</Button>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: The Workbench */}
          <Card>
            <Tabs defaultValue="validation" className="w-full">
              <CardHeader className="border-b">
                <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                  <TabsTrigger value="validation" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                    Validation Checks
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                    Activity History
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                    Comments & Notes
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Tab 1: Validation Checks */}
                <TabsContent value="validation" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {validationChecks.map((check, idx) => {
                      const statusConfig = {
                        pass: { bg: "bg-green-50/50", border: "border-green-200", icon: <CheckCircle className="h-6 w-6 text-green-500" /> },
                        fail: { bg: "bg-red-50/50", border: "border-red-200", icon: <XCircle className="h-6 w-6 text-red-500" /> },
                        warn: { bg: "bg-yellow-50/50", border: "border-yellow-200", icon: <AlertTriangle className="h-6 w-6 text-yellow-500" /> },
                        inactive: { bg: "bg-muted/50", border: "border-border", icon: <FileText className="h-6 w-6 text-muted-foreground" /> }
                      }[check.status] || { bg: "bg-muted/50", border: "border-border", icon: <FileText className="h-6 w-6" /> };

                      return (
                        <div 
                          key={idx} 
                          className={`border rounded-lg p-4 ${statusConfig.bg} ${statusConfig.border} cursor-pointer hover:shadow-md transition-shadow`}
                          onClick={() => handleCheckClick(check)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {statusConfig.icon}
                              <h4 className="text-base font-semibold">{check.title}</h4>
                            </div>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{check.summary}</p>
                          <dl className="space-y-2 text-sm">
                            {check.data.map((item, i) => (
                              <div key={i} className="flex justify-between">
                                <dt className="text-muted-foreground">{item.label}:</dt>
                                <dd className={`font-medium ${item.highlight && check.status === 'fail' ? 'text-red-600' : ''} ${item.highlight && check.status === 'warn' ? 'text-yellow-700' : ''}`}>
                                  {item.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Tab 2: Activity History */}
                <TabsContent value="history" className="mt-0">
                  <div className="flow-root">
                    <ul className="space-y-6">
                      {activityHistory.map((activity, idx) => (
                        <li key={idx}>
                          <div className="relative pb-8">
                            {idx !== activityHistory.length - 1 && (
                              <span className="absolute left-4 top-10 -ml-px h-full w-0.5 bg-border" aria-hidden="true"></span>
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full ${activity.iconBg} flex items-center justify-center ring-8 ring-background`}>
                                  {activity.icon}
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    {activity.text} <span className="font-medium text-foreground">{activity.highlight}</span>
                                  </p>
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-muted-foreground">
                                  {activity.timestamp}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                {/* Tab 3: Comments & Notes */}
                <TabsContent value="comments" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="comment">Add a comment</Label>
                      <Textarea
                        id="comment"
                        placeholder="Add notes, use #hashtags, or @mention teammates..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <Button variant="outline" type="button" className="gap-2">
                        <Paperclip className="h-4 w-4" />
                        Attach File
                      </Button>
                      <Button 
                        onClick={handleSubmitComment}
                        disabled={!comment.trim() || submittingComment}
                        className="gap-2"
                      >
                        {submittingComment ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Post Comment
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    {comments.length === 0 ? (
                      <h4 className="text-sm font-medium text-muted-foreground">No comments yet.</h4>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((c, idx) => (
                          <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium">{c.created_by}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(c.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{c.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </>
      )}

      {/* Section 4: Task Drawer */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {activeAction === 'dispute' && 'Add Dispute'}
              {activeAction === 'credit' && 'Add Credit'}
              {activeAction === 'absorption' && 'Add Absorption'}
              {activeAction === 'vendor-credit' && 'Add Vendor Credit'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {activeAction === 'dispute' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dispute Status</Label>
                    <Select defaultValue="pending">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dispute Date</Label>
                    <Input type="date" defaultValue="2025-10-29" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dispute Amount</Label>
                  <Input type="number" placeholder="$0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Dispute #</Label>
                  <Input placeholder="Dispute ID from carrier" />
                </div>
                <div className="space-y-2">
                  <Label>Dispute Reason</Label>
                  <Textarea rows={3} placeholder="e.g., Billed for 2 days not covered by usage..." />
                </div>
                <div className="space-y-2">
                  <Label>Dispute Document</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50 cursor-pointer hover:bg-muted">
                    <Upload className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium text-primary">Upload a file</p>
                    <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PDF, PNG, JPG, or Email up to 10MB</p>
                  </div>
                </div>
              </>
            )}

            {activeAction === 'credit' && (
              <>
                <div className="space-y-2">
                  <Label>Credit Date</Label>
                  <Input type="date" defaultValue="2025-10-29" />
                </div>
                <div className="space-y-2">
                  <Label>Credit Amount</Label>
                  <Input type="number" placeholder="$0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Credit Reason</Label>
                  <Textarea rows={3} placeholder="e.g., Goodwill credit from EP..." />
                </div>
                <div className="space-y-2">
                  <Label>Credit Document</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50 cursor-pointer hover:bg-muted">
                    <Upload className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium text-primary">Upload a file</p>
                    <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                  </div>
                </div>
              </>
            )}

            {activeAction === 'absorption' && (
              <>
                <div className="space-y-2">
                  <Label>Absorption Account Manager</Label>
                  <Select defaultValue="rich-king">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rich-king">Rich King</SelectItem>
                      <SelectItem value="other">Other AM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Absorption Carrier</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Absorption Customer</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Absorption Amount</Label>
                  <Input type="number" placeholder="$0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Absorption Reason</Label>
                  <Textarea rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Absorption Document</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50 cursor-pointer hover:bg-muted">
                    <Upload className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium text-primary">Upload a file</p>
                  </div>
                </div>
              </>
            )}

            {activeAction === 'vendor-credit' && (
              <>
                <div className="space-y-2">
                  <Label>Vendor Credit #</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Vendor Credit Reason</Label>
                  <Textarea rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Vendor Credit Document</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50 cursor-pointer hover:bg-muted">
                    <Upload className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium text-primary">Upload a file</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDrawer}>Cancel</Button>
            <Button onClick={closeDrawer}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Check Detail Dialog */}
      <Dialog open={checkDialogOpen} onOpenChange={setCheckDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {selectedCheck && (() => {
                const statusConfig: any = {
                  pass: { icon: CheckCircle, iconColor: 'text-green-500' },
                  fail: { icon: XCircle, iconColor: 'text-red-500' },
                  warn: { icon: AlertTriangle, iconColor: 'text-yellow-500' },
                  inactive: { icon: FileText, iconColor: 'text-muted-foreground' }
                };
                const config = statusConfig[selectedCheck.status as keyof typeof statusConfig];
                const Icon = config.icon;
                return (
                  <>
                    <Icon className={`h-6 w-6 ${config.iconColor}`} />
                    {selectedCheck.title}
                  </>
                );
              })()}
            </DialogTitle>
            <DialogDescription>
              {selectedCheck?.summary}
            </DialogDescription>
          </DialogHeader>

          {selectedCheck && (
            <div className="space-y-6 py-4">
              {/* Validation Logic */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Validation Logic</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {selectedCheck.logic}
                </p>
              </div>

              {/* Current Values */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Current Values</h4>
                <dl className="space-y-2 text-sm bg-muted p-3 rounded-md">
                  {selectedCheck.data.map((detail: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <dt className="text-muted-foreground">{detail.label}:</dt>
                      <dd className={`font-medium ${detail.highlight ? (selectedCheck.status === 'fail' ? 'text-red-600' : 'text-yellow-700') : ''}`}>
                        {detail.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Override Options */}
              <div>
                <Label htmlFor="override-status" className="text-sm font-semibold">
                  Override Status
                </Label>
                <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                  <SelectTrigger id="override-status" className="mt-2">
                    <SelectValue placeholder="Select override action..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCheck.overrideOptions?.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Override Comment */}
              <div>
                <Label htmlFor="override-comment" className="text-sm font-semibold">
                  Comment / Justification
                </Label>
                <Textarea
                  id="override-comment"
                  rows={3}
                  className="mt-2"
                  placeholder="Explain why you're overriding this check..."
                  value={overrideComment}
                  onChange={(e) => setOverrideComment(e.target.value)}
                />
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="override-file" className="text-sm font-semibold">
                  Supporting Documentation
                </Label>
                <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Input
                    id="override-file"
                    type="file"
                    className="hidden"
                    onChange={(e) => setOverrideFile(e.target.files?.[0] || null)}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx,.xls"
                  />
                  <label htmlFor="override-file" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    {overrideFile ? (
                      <p className="text-sm font-medium text-primary">{overrideFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-primary">Upload a file</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, PNG, JPG, DOC, or Excel up to 10MB
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOverride}>
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceLineDetails;