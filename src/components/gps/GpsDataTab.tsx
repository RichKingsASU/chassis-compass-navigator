
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, MapPin, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChassisLink } from '@/hooks/useChassisLink';

interface GpsData {
  chassisId: string;
  timestamp: string;
  location: string;
  coordinates: string;
  speed: string;
  notes: string;
}

interface GpsDataTabProps {
  extractedData: GpsData[];
}

const GpsDataTab: React.FC<GpsDataTabProps> = ({ extractedData }) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Extracted GPS Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chassis ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extractedData.map((data, index) => (
                <GpsDataRow key={index} data={data} navigate={navigate} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const GpsDataRow: React.FC<{ data: GpsData; navigate: any }> = ({ data, navigate }) => {
  const { data: chassisLink } = useChassisLink(data.chassisId !== 'N/A' ? data.chassisId : undefined);

  const handleViewChassis = () => {
    if (chassisLink) {
      navigate(`/chassis/${data.chassisId}`);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{data.chassisId}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Clock size={14} className="text-muted-foreground" />
          {data.timestamp}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-secondary" />
          {data.location}
        </div>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{data.coordinates}</TableCell>
      <TableCell>{data.speed}</TableCell>
      <TableCell>{data.notes}</TableCell>
      <TableCell>
        {chassisLink ? (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleViewChassis}
            title="View Chassis Details"
          >
            <ExternalLink size={16} />
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
    </TableRow>
  );
};

export default GpsDataTab;
