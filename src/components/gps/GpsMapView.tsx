import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GpsMapViewProps {
  providerName: string;
}

const GpsMapView: React.FC<GpsMapViewProps> = ({ providerName }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          GPS Map View
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            GPS data tables are not configured in the database. Configure tables to view GPS data on map.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col items-center justify-center h-[500px] text-center border rounded-lg bg-muted/20">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">No GPS data available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Provider: {providerName}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GpsMapView;
