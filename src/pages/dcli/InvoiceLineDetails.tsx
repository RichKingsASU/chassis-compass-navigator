import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const InvoiceLineDetails = () => {
  const navigate = useNavigate();
  const { lineId } = useParams();

  const navigateBack = () => {
    navigate('/vendors/dcli/invoices/new', { replace: false });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={navigateBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Invoice Line Validation</h1>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          DCLI invoice line item table (dcli_invoice_line_item) is not configured in the database.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Line Item #{lineId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Line item validation unavailable. Configure database tables to view and validate line items.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceLineDetails;
