import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Upload, MessageSquare, History } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const InvoiceLineDetails = () => {
  const { lineId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: lineItem, isLoading } = useQuery({
    queryKey: ['ccm-invoice-line', lineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ccm_invoice_data')
        .select('*')
        .eq('id', Number(lineId))
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: comments } = useQuery({
    queryKey: ['line-comments', lineId],
    queryFn: async () => {
      // For now, return empty array. In production, fetch from a comments table
      return [];
    }
  });

  const { data: history } = useQuery({
    queryKey: ['line-history', lineId],
    queryFn: async () => {
      // For now, return empty array. In production, fetch from a history table
      return [];
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      // In production, save to a comments table
      // For now, we'll just update the row_data
      const rowData = lineItem?.row_data as Record<string, any> || {};
      const updatedRowData = {
        ...rowData,
        comments: [...(rowData.comments || []), {
          text: comment,
          created_at: new Date().toISOString(),
          user: 'Current User'
        }]
      };
      
      const { error } = await supabase
        .from('ccm_invoice_data')
        .update({ row_data: updatedRowData })
        .eq('id', Number(lineId));
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccm-invoice-line', lineId] });
      queryClient.invalidateQueries({ queryKey: ['line-comments', lineId] });
      setNewComment('');
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${lineId}-${Date.now()}.${fileExt}`;
      const filePath = `line-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ccm-invoices')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update line item with attachment
      const rowData = lineItem?.row_data as Record<string, any> || {};
      const updatedRowData = {
        ...rowData,
        attachments: [...(rowData.attachments || []), {
          name: file.name,
          path: filePath,
          uploaded_at: new Date().toISOString()
        }]
      };

      const { error: updateError } = await supabase
        .from('ccm_invoice_data')
        .update({ row_data: updatedRowData })
        .eq('id', Number(lineId));

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['ccm-invoice-line', lineId] });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'in progress';
    const variants: Record<string, string> = {
      'paid': 'bg-green-100 text-green-800 border-green-200',
      'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'dispute': 'bg-red-100 text-red-800 border-red-200',
      'absorbed': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      <Badge variant="outline" className={variants[statusLower] || variants['in progress']}>
        {status || 'In Progress'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!lineItem) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Line item not found</p>
          <Button className="mt-4" onClick={() => navigate('/vendors/ccm')}>
            Back to CCM Portal
          </Button>
        </div>
      </div>
    );
  }

  const rowData = (lineItem.row_data as Record<string, any>) || {};
  const attachments = rowData.attachments || [];
  const lineComments = rowData.comments || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button onClick={() => navigate(-1)} variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Line Item Details</h1>
        <p className="text-muted-foreground">View and manage line item information</p>
      </div>

      {/* Line Item Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Line Item Information
            {getStatusBadge(rowData.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(rowData).map(([key, value]) => {
              if (key === 'comments' || key === 'attachments') return null;
              return (
                <div key={key}>
                  <p className="text-sm font-medium text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg">{String(value) || 'N/A'}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineComments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {lineComments.map((comment: any, index: number) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{comment.user}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
          <Separator />
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button
              onClick={() => addCommentMutation.mutate(newComment)}
              disabled={!newComment.trim() || addCommentMutation.isPending}
            >
              Add Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attachments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attachments</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{attachment.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(attachment.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Separator />
          <div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploadingFile}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploadingFile}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadingFile ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history && history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history available</p>
          ) : (
            <div className="space-y-2">
              {/* History items would go here */}
              <p className="text-sm text-muted-foreground">History tracking coming soon</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceLineDetails;
