
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, MapPin, Tag } from 'lucide-react';

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
                <TableRow key={index}>
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
                    <Button variant="ghost" size="sm">
                      <Tag size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GpsDataTab;
