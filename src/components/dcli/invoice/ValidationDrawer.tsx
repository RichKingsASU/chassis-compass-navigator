import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, AlertTriangle, XCircle, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
}

const ValidationDrawer: React.FC<ValidationDrawerProps> = ({ validationResult }) => {
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
          <MatchTable matches={exactMatches} type="exact" />
        </TabsContent>

        <TabsContent value="fuzzy" className="mt-4">
          <MatchTable matches={fuzzyMatches} type="fuzzy" />
        </TabsContent>

        <TabsContent value="mismatches" className="mt-4">
          <MatchTable matches={mismatches} type="mismatch" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TroubleshootPanel = ({ match }: { match: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  const checks = [
    {
      title: 'Equipment Verification',
      items: [
        { label: 'Invoice Chassis', value: match.chassis || 'N/A', status: match.tms_match?.chassis_number === match.chassis ? 'match' : 'mismatch' },
        { label: 'TMS Chassis', value: match.tms_match?.chassis_number || 'N/A', status: 'info' },
        { label: 'Invoice Container', value: match.container || 'N/A', status: match.tms_match?.container_number === match.container ? 'match' : 'mismatch' },
        { label: 'TMS Container', value: match.tms_match?.container_number || 'N/A', status: 'info' },
      ]
    },
    {
      title: 'Match Analysis',
      items: [
        { label: 'Confidence Score', value: `${match.match_confidence}%`, status: match.match_confidence === 100 ? 'match' : match.match_confidence >= 60 ? 'warning' : 'mismatch' },
        { label: 'Match Type', value: match.match_type, status: match.match_type === 'exact' ? 'match' : match.match_type === 'fuzzy' ? 'warning' : 'mismatch' },
      ]
    },
    {
      title: 'TMS Data',
      items: [
        { label: 'LD Number', value: match.tms_match?.ld_num || 'Not Found', status: match.tms_match?.ld_num ? 'info' : 'mismatch' },
        { label: 'SO Number', value: match.tms_match?.so_num || 'Not Found', status: match.tms_match?.so_num ? 'info' : 'mismatch' },
        { label: 'Carrier', value: match.tms_match?.carrier_name || 'Not Found', status: match.tms_match?.carrier_name ? 'info' : 'mismatch' },
        { label: 'Customer', value: match.tms_match?.customer_name || 'Not Found', status: match.tms_match?.customer_name ? 'info' : 'mismatch' },
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    if (status === 'match') return 'text-green-600';
    if (status === 'warning') return 'text-yellow-600';
    if (status === 'mismatch') return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 font-normal">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Troubleshoot
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <Card className="p-4 bg-muted/30">
          <div className="space-y-4">
            {checks.map((check, index) => (
              <div key={index}>
                <h4 className="text-sm font-semibold mb-2">{check.title}</h4>
                <div className="space-y-1 pl-2">
                  {check.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between text-xs py-1">
                      <span className="font-medium">{item.label}:</span>
                      <span className={getStatusColor(item.status)}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

const MatchTable = ({
  matches,
  type,
}: {
  matches: any[];
  type: 'exact' | 'fuzzy' | 'mismatch';
}) => {
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match, idx) => (
            <React.Fragment key={idx}>
              <TableRow>
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
              </TableRow>
              {match.match_confidence < 100 && (
                <TableRow>
                  <TableCell colSpan={4} className="p-2 bg-muted/20">
                    <TroubleshootPanel match={match} />
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ValidationDrawer;
