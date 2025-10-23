import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const InvoiceLineDispute = () => {
  const { lineId } = useParams();
  const navigate = useNavigate();

  // Placeholder dispute history
  const disputeHistory = [
    {
      date: '2025-01-15',
      action: 'Dispute Opened',
      user: 'John Doe',
      note: 'Container number mismatch - invoice shows MSCU9876543 but TMS shows MSCU9876540'
    },
    {
      date: '2025-01-16',
      action: 'Update Added',
      user: 'Jane Smith',
      note: 'Contacted vendor for clarification on container number discrepancy'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/vendors/dcli/invoice-line/${lineId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Line Dispute</h1>
          <p className="text-muted-foreground">
            Dispute history for line {lineId}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dispute Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Line Invoice #</label>
              <p className="text-lg font-mono">{lineId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant="destructive">In Dispute</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispute History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {disputeHistory.map((entry, index) => (
              <div key={index} className="border-l-2 border-primary pl-4 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{entry.action}</h4>
                    <p className="text-sm text-muted-foreground">by {entry.user}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{entry.date}</span>
                </div>
                <p className="text-sm">{entry.note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Placeholder for dispute management actions (Add Update, Close Dispute, etc.)
          </p>
          <div className="flex gap-2">
            <Button variant="outline">Add Update</Button>
            <Button variant="default">Close Dispute</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/vendors/dcli/invoice-line/${lineId}`)}
        >
          Back to Details
        </Button>
      </div>
    </div>
  );
};

export default InvoiceLineDispute;
