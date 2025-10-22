import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const InvoiceReview = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/vendors/trac')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          TRAC invoice tables not configured in database.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Invoice review unavailable. Configure trac_invoice table.
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceReview;
