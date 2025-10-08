import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TRACDetailView = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Details</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Select an invoice to view details.</p>
      </CardContent>
    </Card>
  );
};

export default TRACDetailView;
