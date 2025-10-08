import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const InvoiceReview = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vendors/trac")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Review TRAC Invoice</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Invoice review functionality pending TRAC data integration.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceReview;
