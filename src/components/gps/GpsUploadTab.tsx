import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GpsUploadTabProps {
  providerName: string;
  onUploadSuccess: () => void;
}

const GpsUploadTab: React.FC<GpsUploadTabProps> = ({ providerName }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload GPS Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            GPS upload tables (gps_uploads, gps_data) are not configured in the database.
          </AlertDescription>
        </Alert>
        
        <div className="border-2 border-dashed rounded-lg p-12 text-center bg-muted/20">
          <Upload className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload Feature Unavailable</h3>
          <p className="text-muted-foreground mb-4">
            Configure database tables to enable GPS data uploads for {providerName}
          </p>
          <Button disabled variant="outline">
            Select File
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GpsUploadTab;
