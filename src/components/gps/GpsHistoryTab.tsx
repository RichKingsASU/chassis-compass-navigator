
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface GpsHistoryTabProps {
  providerName: string;
  onViewData: () => void;
}

const GpsHistoryTab: React.FC<GpsHistoryTabProps> = ({ 
  providerName, 
  onViewData 
}) => {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUploads();
  }, [providerName]);

  const fetchUploads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gps_uploads')
      .select('*')
      .eq('provider', providerName)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Error",
        description: "Failed to load upload history",
        variant: "destructive"
      });
    } else {
      setUploads(data || []);
    }
    setLoading(false);
  };

  const handleReprocess = async (upload: any) => {
    setProcessingId(upload.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('ingest-blackberry-log', {
        body: {
          bucket: 'gps-uploads',
          path: upload.file_path
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Ingested ${data.inserted} GPS records`
      });

      // Refresh the list
      await fetchUploads();
    } catch (error: any) {
      console.error('Reprocess error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reprocess file",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Processed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Processing</Badge>;
      case 'uploaded':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Uploaded</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Previous Uploads</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : uploads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No uploads yet</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Row Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">{upload.file_name}</TableCell>
                    <TableCell>{format(new Date(upload.created_at), 'MMM d, yyyy h:mm a')}</TableCell>
                    <TableCell>{upload.row_count || 0}</TableCell>
                    <TableCell>{getStatusBadge(upload.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={onViewData}>
                          View Data
                        </Button>
                        {providerName === 'BlackBerry Radar' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleReprocess(upload)}
                            disabled={processingId === upload.id}
                          >
                            <RefreshCw className={`h-4 w-4 mr-1 ${processingId === upload.id ? 'animate-spin' : ''}`} />
                            Re-ingest
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GpsHistoryTab;
