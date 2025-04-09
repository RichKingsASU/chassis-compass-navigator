
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UploadHistory {
  id: number;
  filename: string;
  uploadDate: string;
  chassisCount: number;
  status: string;
}

interface GpsHistoryTabProps {
  providerName: string;
  previousUploads: UploadHistory[];
  onViewData: () => void;
}

const GpsHistoryTab: React.FC<GpsHistoryTabProps> = ({ 
  providerName, 
  previousUploads, 
  onViewData 
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Processed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Processing</Badge>;
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Chassis Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previousUploads.map((upload) => (
                <TableRow key={upload.id}>
                  <TableCell className="font-medium">{upload.filename}</TableCell>
                  <TableCell>{upload.uploadDate}</TableCell>
                  <TableCell>{upload.chassisCount}</TableCell>
                  <TableCell>{getStatusBadge(upload.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={onViewData}>
                        View Data
                      </Button>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GpsHistoryTab;
