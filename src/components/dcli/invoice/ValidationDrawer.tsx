import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, AlertTriangle, XCircle, Info, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TMSMatch {
  ld_num: string;
  so_num: string;
  shipment_number: string;
  chassis_number: string;
  container_number: string;
  pickup_actual_date: string;
  delivery_actual_date: string;
  carrier_name: string;
  customer_name: string;
  confidence: number;
  match_reasons: string[];
}

interface ValidationDrawerProps {
  validationResult: {
    summary: {
      exact_matches: number;
      fuzzy_matches: number;
      mismatches: number;
      total_rows: number;
    };
    rows: Array<{
      line_invoice_number: string;
      chassis: string;
      container: string;
      match_confidence: number;
      match_type: 'exact' | 'fuzzy' | 'mismatch';
      tms_match: TMSMatch | null;
    }>;
    errors: string[];
  };
  navigationState?: any;
}

const ValidationDrawer: React.FC<ValidationDrawerProps> = ({ validationResult, navigationState }) => {
  const exactMatches = validationResult.rows.filter((r) => r.match_type === 'exact');
  const fuzzyMatches = validationResult.rows.filter((r) => r.match_type === 'fuzzy');
  const mismatches = validationResult.rows.filter((r) => r.match_type === 'mismatch');

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Exact Matches</span>
          </div>
          <div className="text-2xl font-bold">{validationResult.summary.exact_matches}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Fuzzy Matches</span>
          </div>
          <div className="text-2xl font-bold">{validationResult.summary.fuzzy_matches}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">Mismatches</span>
          </div>
          <div className="text-2xl font-bold">{validationResult.summary.mismatches}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Total Rows</span>
          </div>
          <div className="text-2xl font-bold">{validationResult.summary.total_rows}</div>
        </Card>
      </div>

      {/* Errors */}
      {validationResult.errors.length > 0 && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <div className="font-semibold text-destructive mb-2">Validation Errors</div>
          <ul className="space-y-1">
            {validationResult.errors.map((error, idx) => (
              <li key={idx} className="text-sm text-destructive">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="exact" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="exact">
            Exact Matches ({exactMatches.length})
          </TabsTrigger>
          <TabsTrigger value="fuzzy">
            Fuzzy Matches ({fuzzyMatches.length})
          </TabsTrigger>
          <TabsTrigger value="mismatches">
            Mismatches ({mismatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exact" className="mt-4">
          <MatchTable matches={exactMatches} type="exact" navigationState={navigationState} />
        </TabsContent>

        <TabsContent value="fuzzy" className="mt-4">
          <MatchTable matches={fuzzyMatches} type="fuzzy" navigationState={navigationState} />
        </TabsContent>

        <TabsContent value="mismatches" className="mt-4">
          <MatchTable matches={mismatches} type="mismatch" navigationState={navigationState} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const MatchTable = ({
  matches,
  type,
  navigationState,
}: {
  matches: any[];
  type: 'exact' | 'fuzzy' | 'mismatch';
  navigationState?: any;
}) => {
  const navigate = useNavigate();

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {type} matches found.
      </div>
    );
  }

  const getBadgeVariant = (type: string) => {
    if (type === 'exact') return 'default';
    if (type === 'fuzzy') return 'secondary';
    return 'destructive';
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Line Invoice #</TableHead>
            <TableHead>Equipment</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>TMS Match (LD/SO Numbers)</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-mono text-xs align-top">
                {match.line_invoice_number}
              </TableCell>
              <TableCell className="text-xs align-top">
                <div>Chassis: {match.chassis || 'N/A'}</div>
                <div>Container: {match.container || 'N/A'}</div>
              </TableCell>
              <TableCell className="align-top">
                <Badge variant={getBadgeVariant(type)}>{match.match_confidence}%</Badge>
              </TableCell>
              <TableCell>
                {match.tms_match ? (
                  <Card
                    className="p-3 bg-muted/30 border-l-4"
                    style={{
                      borderLeftColor:
                        match.tms_match.confidence >= 90
                          ? 'hsl(var(--primary))'
                          : match.tms_match.confidence >= 60
                          ? 'hsl(var(--secondary))'
                          : 'hsl(var(--destructive))',
                    }}
                  >
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>
                        <span className="font-medium">LD#:</span>{' '}
                        <span className="font-mono">{match.tms_match.ld_num || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium">SO#:</span>{' '}
                        <span className="font-mono">{match.tms_match.so_num || 'N/A'}</span>
                      </div>
                      {match.tms_match.shipment_number && (
                        <div className="col-span-2">
                          <span className="font-medium">Shipment:</span>{' '}
                          <span className="font-mono">{match.tms_match.shipment_number}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Chassis:</span>{' '}
                        <span className="font-mono">{match.tms_match.chassis_number || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium">Container:</span>{' '}
                        <span className="font-mono">{match.tms_match.container_number || 'N/A'}</span>
                      </div>
                      {match.tms_match.carrier_name && (
                        <div className="col-span-2">
                          <span className="font-medium">Carrier:</span> {match.tms_match.carrier_name}
                        </div>
                      )}
                      {match.tms_match.customer_name && (
                        <div className="col-span-2">
                          <span className="font-medium">Customer:</span> {match.tms_match.customer_name}
                        </div>
                      )}
                    </div>
                    {Array.isArray(match.tms_match.match_reasons) && match.tms_match.match_reasons.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="text-xs font-medium mb-1">Match Reasons:</div>
                        <div className="flex flex-wrap gap-1">
                          {match.tms_match.match_reasons.filter(Boolean).map((reason, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ) : (
                  <span className="text-xs text-muted-foreground">No TMS match found</span>
                )}
              </TableCell>
              <TableCell className="align-top">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/vendors/dcli/invoice-line/${match.line_invoice_number}`, {
                    state: navigationState
                  })}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ValidationDrawer;
