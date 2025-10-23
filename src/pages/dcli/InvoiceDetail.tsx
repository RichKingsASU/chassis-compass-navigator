import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const InvoiceDetail = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/vendors/dcli')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Invoice Details</h1>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          DCLI invoice tables (dcli_invoice, dcli_invoice_line_item) are not configured in the database.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Invoice #{invoiceId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Invoice data unavailable. Configure database tables to view invoice details.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetail;
