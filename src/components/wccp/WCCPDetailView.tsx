import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

interface WCCPDetailViewProps {
  record: any;
  onBack: () => void;
}

const WCCPDetailView = ({ record, onBack }: WCCPDetailViewProps) => {
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
          <p className="text-muted-foreground">
            Detailed invoice view will be available once WCCP data integration is complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WCCPDetailView;
