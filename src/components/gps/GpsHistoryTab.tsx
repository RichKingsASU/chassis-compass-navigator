import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GpsHistoryTabProps {
  providerName: string;
  onViewData: () => void;
}

const GpsHistoryTab: React.FC<GpsHistoryTabProps> = ({ providerName }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Upload History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            GPS uploads table is not configured in the database.
          </AlertDescription>
        </Alert>
        
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No upload history available</p>
          <p className="text-sm mt-2">Provider: {providerName}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GpsHistoryTab;
