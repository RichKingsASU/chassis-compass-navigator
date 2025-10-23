import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, Link2, Mail } from 'lucide-react';

export interface SopGuideProps {
  // Hints to auto-focus sections
  bucket?: 'no_load' | 'date_outside' | 'rate_variance' | 'duplicates' | 'pool_mismatch' | 'ok';
  context?: {
    invoice?: string;
    lineNumber?: string;
    chassisId?: string;
    containerId?: string;
    ldNum?: string;
    soNum?: string;
    customerName?: string;
    acctManager?: string;
  };
}

/**
 * DCLI SOP guide:
 * - Master Checklist (quick pass/fail)
 * - Guided actions per failure mode
 * - DCLI portal dispute steps
 * This is intentionally text-first, minimal logic, so it's easy to update by Ops.
 */
const SOPGuide: React.FC<SopGuideProps> = ({ bucket, context }) => {
  const SectionTitle: React.FC<{ title: string; badge?: string }> = ({ title, badge }) => (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {badge ? <Badge variant="secondary">{badge}</Badge> : null}
    </div>
  );

  const HintRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div className="text-xs text-muted-foreground"><span className="font-medium">{label}:</span> {value || '—'}</div>
  );

  return (
    <div className="space-y-4">
      {/* Context header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Context</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <HintRow label="Invoice" value={context?.invoice} />
              <HintRow label="Line #" value={context?.lineNumber} />
              <HintRow label="Chassis" value={context?.chassisId} />
              <HintRow label="Container" value={context?.containerId} />
              <HintRow label="LD #" value={context?.ldNum} />
              <HintRow label="SO #" value={context?.soNum} />
              <HintRow label="Customer" value={context?.customerName} />
              <HintRow label="Account Manager" value={context?.acctManager} />
            </div>
          </div>
          <Badge variant={bucket === 'ok' ? 'default' : 'destructive'}>
            {bucket === 'ok' ? 'Clean' : bucket?.replace('_', ' ') || 'Review Needed'}
          </Badge>
        </div>
      </Card>

      {/* Master checklist */}
      <Card className="p-4">
        <SectionTitle title="Master Validation Checklist (DCLI)" badge="follow in order" />
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Load exists in TMS (by Container or Chassis) within billed window.</li>
          <li>Equipment identity matches (normalized keys; hyphens ignored).</li>
          <li>Bill Start–End overlaps Delivery or Return (±1 day tolerance).</li>
          <li>Bill Days equal inclusive diff (End − Start + 1), unless tiered rules apply.</li>
          <li>Daily rate matches contract/pool; totals compute correctly.</li>
          <li>Pool/chassis type aligns with TMS.</li>
          <li>Customer billability set (SO present & amounts mirror expense line).</li>
          <li>No duplicate billing (same chassis, overlapping dates across invoices).</li>
          <li>Notes & evidence attached (terminal record / outgate / approvals).</li>
        </ol>
      </Card>

      {/* Guided actions by bucket */}
      <Card className="p-4">
        <SectionTitle title="Guided Actions" badge="what to do if it fails" />
        <div className="space-y-4 text-sm">
          <div className={bucket === 'no_load' ? 'border-l-4 border-amber-500 pl-3' : ''}>
            <div className="font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> No Load Found</div>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Search TMS by <b>Container</b> and <b>Chassis</b> for the billed window.</li>
              <li>Pull terminal <b>outgate</b> (or steamship record), identify carrier (eModal/SCAC).</li>
              <li>Email carrier per SCAC misuse SOP; attach outgate proof.</li>
              <li>Open DCLI portal dispute and attach evidence; note expected credit.</li>
            </ul>
          </div>

          <div className={bucket === 'date_outside' ? 'border-l-4 border-amber-500 pl-3' : ''}>
            <div className="font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Date Window Out</div>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Check terminal timestamps; correct TMS dates if ours are wrong.</li>
              <li>If vendor over-billed days, dispute the delta; compute expected credit.</li>
            </ul>
          </div>

          <div className={bucket === 'rate_variance' ? 'border-l-4 border-amber-500 pl-3' : ''}>
            <div className="font-medium">Rate Variance</div>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Verify contract/pool daily rate or AM-approved rate.</li>
              <li>Request vendor rate correction; document in notes.</li>
            </ul>
          </div>

          <div className={bucket === 'duplicates' ? 'border-l-4 border-amber-500 pl-3' : ''}>
            <div className="font-medium">Duplicate Billing Detected</div>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Confirm overlapping windows with a prior invoice line (same chassis).</li>
              <li>Dispute the duplicate and attach the prior invoice evidence.</li>
            </ul>
          </div>

          <div className={bucket === 'pool_mismatch' ? 'border-l-4 border-amber-500 pl-3' : ''}>
            <div className="font-medium">Pool / Chassis Type Mismatch</div>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Correct TMS if our pool/type is wrong; otherwise dispute vendor miscoding.</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* DCLI portal steps */}
      <Card className="p-4">
        <SectionTitle title="DCLI Portal Dispute Steps" badge="attach evidence" />
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Open the invoice in the DCLI Bill Management portal.</li>
          <li>Select the line(s) to dispute; choose reason (over-billed days, wrong rate, no load, duplicate).</li>
          <li>Attach evidence (outgate/terminal records, TMS screenshots, prior invoice, AM approval).</li>
          <li>Submit and record the dispute ID in notes; set a follow-up date.</li>
        </ol>
        <div className="flex gap-2 mt-3">
          <Button variant="secondary" size="sm"><Link2 className="w-4 h-4 mr-2" /> Open DCLI Portal</Button>
          <Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-2" /> Copy Carrier Misuse Email</Button>
        </div>
      </Card>

      {/* Success reminder */}
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" />
        When all checks pass, proceed to Submit and archive your evidence links in "Notes".
      </div>
    </div>
  );
};

export default SOPGuide;
