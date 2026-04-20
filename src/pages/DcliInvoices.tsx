import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  fetchSOAList, fetchLineItems, fetchReconciliation, fetchGlExportPending, fetchConfigTable,
  type DcliInvoiceSOA, type DcliLineDisplay, type DcliReconciliation,
  type DcliGlExportRow, type DcliConfigRow,
} from "@/integrations/supabase/dcli";

// ---------------------------------------------------------------------------
// Formatting helpers — kept local; no global util sprawl.
// ---------------------------------------------------------------------------
const fmtMoney = (n: number | null | undefined) =>
  n == null ? "" : n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmtDate = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString("en-US") : "");
const fmtDT   = (s: string | null | undefined) => (s ? new Date(s).toLocaleString("en-US") : "");

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DcliInvoices() {
  return (
    <div className="container mx-auto py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">DCLI Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Side-by-side view of the DCLI Chassis Expenses workbook, imported into Supabase.
          Read-only MVP for UX evaluation.
        </p>
      </div>

      <Tabs defaultValue="soa" className="w-full">
        <TabsList>
          <TabsTrigger value="soa">SOA</TabsTrigger>
          <TabsTrigger value="lines">DCLI (Line Items)</TabsTrigger>
          <TabsTrigger value="gl">Data for GL Template</TabsTrigger>
          <TabsTrigger value="config">Data Validation</TabsTrigger>
          <TabsTrigger value="recon">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="soa"><SOATab /></TabsContent>
        <TabsContent value="lines"><LinesTab /></TabsContent>
        <TabsContent value="gl"><GLTab /></TabsContent>
        <TabsContent value="config"><ConfigTab /></TabsContent>
        <TabsContent value="recon"><ReconciliationTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SOA tab
// ---------------------------------------------------------------------------
function SOATab() {
  const [rows, setRows] = useState<DcliInvoiceSOA[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchSOAList().then(setRows).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.invoice_number.toLowerCase().includes(q));
  }, [rows, filter]);

  if (loading) return <div className="p-4 text-muted-foreground">Loading invoices…</div>;
  if (err) return <div className="p-4 text-destructive">{err}</div>;
  if (rows.length === 0) return <EmptyState message="No invoices imported yet. Run the CLI importer first." />;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Statement of Account</CardTitle>
          <p className="text-sm text-muted-foreground">{rows.length} invoices</p>
        </div>
        <Input
          placeholder="Search by invoice #"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Invoice Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Total Payments</TableHead>
                <TableHead className="text-right">Dispute Pending</TableHead>
                <TableHead className="text-right">Dispute Approved</TableHead>
                <TableHead className="text-right">Credit Applied</TableHead>
                <TableHead>Vendor Rate in TMS</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.invoice_number}>
                  <TableCell className="font-mono">{r.invoice_number}</TableCell>
                  <TableCell>{fmtDate(r.invoice_date)}</TableCell>
                  <TableCell>{fmtDate(r.due_date)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.invoice_amount)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.balance)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.total_payments)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.dispute_pending_amt)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.dispute_approved_amt)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.credit_applied)}</TableCell>
                  <TableCell>{r.vendor_rate_in_tms}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={r.notes ?? ""}>{r.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Line items tab — mirrors the DCLI sheet column order
// ---------------------------------------------------------------------------
function LinesTab() {
  const [rows, setRows] = useState<DcliLineDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [disputeFilter, setDisputeFilter] = useState<string>("all");

  useEffect(() => {
    fetchLineItems({ limit: 5000 })
      .then(setRows).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return rows.filter((r) => {
      if (paymentFilter !== "all" && r.payment_status !== paymentFilter) return false;
      if (disputeFilter !== "all" && r.dispute_status !== disputeFilter) return false;
      if (!q) return true;
      return (
        (r.invoice && r.invoice.toLowerCase().includes(q)) ||
        (r.chassis && r.chassis.toLowerCase().includes(q)) ||
        (r.container && r.container.toLowerCase().includes(q)) ||
        (r.ld_num && r.ld_num.toLowerCase().includes(q)) ||
        (r.so_num && r.so_num.toLowerCase().includes(q))
      );
    });
  }, [rows, filter, paymentFilter, disputeFilter]);

  if (loading) return <div className="p-4 text-muted-foreground">Loading line items…</div>;
  if (err) return <div className="p-4 text-destructive">{err}</div>;
  if (rows.length === 0) return <EmptyState message="No line items imported yet." />;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <CardTitle>Line Items</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length.toLocaleString()} of {rows.length.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Search invoice / chassis / LD / SO"
                   value={filter} onChange={(e) => setFilter(e.target.value)}
                   className="w-72" />
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="OK_TO_PAY">OK to Pay</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={disputeFilter} onValueChange={setDisputeFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Dispute" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All disputes</SelectItem>
                <SelectItem value="NONE">None</SelectItem>
                <SelectItem value="NEED_TO_DISPUTE">Need to Dispute</SelectItem>
                <SelectItem value="DISPUTE_PENDING">Dispute Pending</SelectItem>
                <SelectItem value="DISPUTE_APPROVED">Dispute Approved</SelectItem>
                <SelectItem value="DISPUTE_REJECTED">Dispute Rejected</SelectItem>
                <SelectItem value="NEED_TO_EMAIL_AM">Need to Email AM</SelectItem>
                <SelectItem value="EMAILED_AM">Emailed AM</SelectItem>
                <SelectItem value="NEED_TO_EMAIL_CARRIER">Need to Email Carrier</SelectItem>
                <SelectItem value="EMAILED_CARRIER">Emailed Carrier</SelectItem>
                <SelectItem value="NEED_TO_EMAIL_TERMINAL">Need to Email Terminal</SelectItem>
                <SelectItem value="EMAILED_TERMINAL">Emailed Terminal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Status Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Line #</TableHead>
                <TableHead>Pool</TableHead>
                <TableHead>Chassis</TableHead>
                <TableHead>Container</TableHead>
                <TableHead>Date Out</TableHead>
                <TableHead>Date In</TableHead>
                <TableHead className="text-right">Bill Days</TableHead>
                <TableHead>OG Location</TableHead>
                <TableHead>IG Location</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Day Variance</TableHead>
                <TableHead>Charge Absorption</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Account Manager</TableHead>
                <TableHead>LD #</TableHead>
                <TableHead>SO #</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><StatusBadge display={r.status_display} payment={r.payment_status} dispute={r.dispute_status} /></TableCell>
                  <TableCell>{fmtDate(r.status_date)}</TableCell>
                  <TableCell className="font-mono">{r.invoice}</TableCell>
                  <TableCell className="text-right">{r.line_number}</TableCell>
                  <TableCell>{r.pool}</TableCell>
                  <TableCell className="font-mono">{r.chassis}</TableCell>
                  <TableCell className="font-mono">{r.container}</TableCell>
                  <TableCell>{fmtDT(r.date_out)}</TableCell>
                  <TableCell>{fmtDT(r.date_in)}</TableCell>
                  <TableCell className="text-right">{r.bill_days}</TableCell>
                  <TableCell className="max-w-[180px] truncate" title={r.og_location ?? ""}>{r.og_location}</TableCell>
                  <TableCell className="max-w-[180px] truncate" title={r.ig_location ?? ""}>{r.ig_location}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.rate)}</TableCell>
                  <TableCell className="text-right font-medium">{fmtMoney(r.total)}</TableCell>
                  <TableCell className={`text-right ${r.day_variance && r.day_variance !== 0 ? "text-amber-600" : ""}`}>{r.day_variance}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={`${r.charge_absorption_category ?? ""} / ${r.charge_absorption_sub_category ?? ""}`}>
                    {r.charge_absorption_category}{r.charge_absorption_sub_category ? ` / ${r.charge_absorption_sub_category}` : ""}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={r.customer ?? ""}>{r.customer}</TableCell>
                  <TableCell>{r.account_manager}</TableCell>
                  <TableCell className="font-mono">{r.ld_num}</TableCell>
                  <TableCell className="font-mono">{r.so_num}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={r.notes ?? ""}>{r.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ display, payment, dispute }: { display: string; payment: string; dispute: string }) {
  const variant: "default" | "secondary" | "outline" | "destructive" =
    payment === "PAID" && dispute === "NONE" ? "outline"
    : dispute.startsWith("NEED_") ? "destructive"
    : payment === "PAID" ? "default"
    : "secondary";
  return <Badge variant={variant} className="whitespace-nowrap">{display}</Badge>;
}

// ---------------------------------------------------------------------------
// GL Template tab — preview of paid-but-not-yet-exported lines
// ---------------------------------------------------------------------------
function GLTab() {
  const [rows, setRows] = useState<DcliGlExportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchGlExportPending().then(setRows).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-muted-foreground">Loading GL template…</div>;
  if (err) return <div className="p-4 text-destructive">{err}</div>;

  const total = rows.reduce((sum, r) => sum + (r.Total ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data for GL Template (Pending Export)</CardTitle>
        <p className="text-sm text-muted-foreground">
          {rows.length} paid line(s) not yet exported to Business Central — total {fmtMoney(total)}.
          The "Export to BC" button will be added in the next phase.
        </p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState message="No paid lines pending export." />
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Invoice #","Date In","Chassis","SO","Total","IEP Name","Company","Type","No.","Description/Comment","Quantity","Direct Unit Cost Excl. Tax","State","Ops Center","Division","Department"].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.invoice_line_id}>
                    <TableCell className="font-mono">{r["Invoice #"]}</TableCell>
                    <TableCell>{fmtDT(r["Date In"])}</TableCell>
                    <TableCell className="font-mono">{r.Chassis}</TableCell>
                    <TableCell className="font-mono">{r.SO}</TableCell>
                    <TableCell className="text-right">{fmtMoney(r.Total)}</TableCell>
                    <TableCell>{r["IEP Name"]}</TableCell>
                    <TableCell>{r.Company}</TableCell>
                    <TableCell>{r.Type}</TableCell>
                    <TableCell>{r["No."]}</TableCell>
                    <TableCell className="max-w-[320px] truncate" title={r["Description/Comment"]}>{r["Description/Comment"]}</TableCell>
                    <TableCell className="text-right">{r.Quantity}</TableCell>
                    <TableCell className="text-right">{fmtMoney(r["Direct Unit Cost Excl. Tax"])}</TableCell>
                    <TableCell>{r.State}</TableCell>
                    <TableCell>{r["Ops Center"]}</TableCell>
                    <TableCell>{r.Division}</TableCell>
                    <TableCell>{r.Department}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Config tab — mirrors the "Data Validation" sheet columns
// ---------------------------------------------------------------------------
function ConfigTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ConfigList title="Payment Status"         table="dcli_payment_status" />
      <ConfigList title="Dispute Status"         table="dcli_dispute_status" />
      <ConfigList title="Charge Absorption Category"     table="dcli_charge_absorption_category" />
      <ConfigList title="Charge Absorption Sub Category" table="dcli_charge_absorption_sub_category" />
      <ConfigList title="Customer"                table="dcli_customer" />
      <ConfigList title="Account Manager"         table="dcli_account_manager" />
    </div>
  );
}

function ConfigList({ title, table }: { title: string; table: string }) {
  const [rows, setRows] = useState<DcliConfigRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigTable(table).then(setRows).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [table]);

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle>
        <p className="text-xs text-muted-foreground">Source: <code>{table}</code> · {rows.length} rows</p>
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-muted-foreground">Loading…</div>
         : err ? <div className="text-destructive">{err}</div>
         : rows.length === 0 ? <EmptyState message="Empty." />
         : (
          <div className="max-h-72 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Value</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.id ?? r.code ?? i}>
                    <TableCell>{r.label ?? r.name ?? r.code}</TableCell>
                    <TableCell>{r.active ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Reconciliation tab — SOA total vs. sum of line items per invoice
// ---------------------------------------------------------------------------
function ReconciliationTab() {
  const [rows, setRows] = useState<DcliReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [onlyVariance, setOnlyVariance] = useState(true);

  useEffect(() => {
    fetchReconciliation().then(setRows).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  const visible = onlyVariance ? rows.filter((r) => r.reconciliation_status !== "MATCH") : rows;

  if (loading) return <div className="p-4 text-muted-foreground">Loading reconciliation…</div>;
  if (err) return <div className="p-4 text-destructive">{err}</div>;

  const counts = {
    MATCH:    rows.filter((r) => r.reconciliation_status === "MATCH").length,
    VARIANCE: rows.filter((r) => r.reconciliation_status === "VARIANCE").length,
    NO_LINES: rows.filter((r) => r.reconciliation_status === "NO_LINES").length,
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>SOA ↔ Line Items Reconciliation</CardTitle>
          <p className="text-sm text-muted-foreground">
            Compares each invoice's <em>Invoice Amount</em> on SOA against the sum of its line-item totals.
          </p>
          <div className="flex gap-2 mt-2 text-sm">
            <Badge variant="outline">Match: {counts.MATCH}</Badge>
            <Badge variant="destructive">Variance: {counts.VARIANCE}</Badge>
            <Badge variant="secondary">No Lines: {counts.NO_LINES}</Badge>
          </div>
        </div>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={onlyVariance} onChange={(e) => setOnlyVariance(e.target.checked)} />
          Only show non-matching
        </label>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">SOA Amount</TableHead>
                <TableHead className="text-right">Lines Total</TableHead>
                <TableHead className="text-right">Δ Amount</TableHead>
                <TableHead className="text-right">Line Count</TableHead>
                <TableHead className="text-right">Δ Dispute Pending</TableHead>
                <TableHead className="text-right">Δ Dispute Approved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r.invoice_number}>
                  <TableCell className="font-mono">{r.invoice_number}</TableCell>
                  <TableCell>{fmtDate(r.invoice_date)}</TableCell>
                  <TableCell>
                    <Badge variant={r.reconciliation_status === "MATCH" ? "outline"
                                  : r.reconciliation_status === "VARIANCE" ? "destructive" : "secondary"}>
                      {r.reconciliation_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{fmtMoney(r.soa_invoice_amount)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.lines_total)}</TableCell>
                  <TableCell className={`text-right ${Math.abs(r.amount_variance) >= 0.01 ? "text-destructive" : ""}`}>
                    {fmtMoney(r.amount_variance)}
                  </TableCell>
                  <TableCell className="text-right">{r.line_count}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.dispute_pending_variance)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.dispute_approved_variance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared empty state — per CCN rule: never show mock data
// ---------------------------------------------------------------------------
function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
      {message}
    </div>
  );
}
