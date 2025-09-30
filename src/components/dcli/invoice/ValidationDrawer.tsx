import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

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
      match_confidence: number;
      matched_tms_id: string | null;
      match_type: 'exact' | 'fuzzy' | 'mismatch';
      reasons: string[];
      delta_fields: Record<string, any>;
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
            <TableHead>Confidence</TableHead>
            <TableHead>TMS Match</TableHead>
            <TableHead>Reasons</TableHead>
            <TableHead>Deltas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-mono text-xs">{match.line_invoice_number}</TableCell>
              <TableCell>
                <Badge variant={getBadgeVariant(type)}>{match.match_confidence}%</Badge>
              </TableCell>
              <TableCell className="text-xs">
                {match.matched_tms_id || <span className="text-muted-foreground">None</span>}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {match.reasons.map((reason: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-xs">
                {Object.keys(match.delta_fields).length > 0 ? (
                  <div className="space-y-1">
                    {Object.entries(match.delta_fields).map(([key, val]) => (
                      <div key={key}>
                        <span className="font-semibold">{key}:</span> {JSON.stringify(val)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ValidationDrawer;
