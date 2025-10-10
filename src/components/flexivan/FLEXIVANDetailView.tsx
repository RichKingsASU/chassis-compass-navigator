import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface FLEXIVANDetailViewProps {
  record: any;
  onBack: () => void;
}

const FLEXIVANDetailView = ({ record, onBack }: FLEXIVANDetailViewProps) => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Invoice details for: {record?.invoice || 'N/A'}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FLEXIVANDetailView;
