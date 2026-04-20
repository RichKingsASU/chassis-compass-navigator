"""
Import DCLI_Chassis_Expenses.xlsx into local Supabase Postgres.

Usage (PowerShell):
    # Default: DSN targets local Supabase on Windows
    python scripts/import_dcli_xlsx.py path\to\DCLI_Chassis_Expenses.xlsx

    # Override DSN if needed
    $env:DCLI_DSN="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    python scripts/import_dcli_xlsx.py DCLI_Chassis_Expenses.xlsx

What it does:
    1. Reads SOA, DCLI sheets from the workbook.
    2. Normalizes column names + data types.
    3. Decomposes the single "Status" column into payment_status + dispute_status.
    4. Upserts dcli_invoice (header).
    5. Upserts dcli_invoice_payment (Payment 1..5 columns → long format).
    6. Upserts dcli_invoice_line (line items).
    7. Reports unmatched customers / account managers / categories (case-insensitive
       match; unmatched rows import with null FK and are listed at the end).

Design notes:
    - Uses plain psycopg (no ORM) to keep the dependency footprint small.
    - Idempotent: re-running with the same file updates existing rows.
    - Does NOT touch BC export tables.
"""
from __future__ import annotations
import os
import sys
import re
import math
import argparse
from datetime import datetime, date
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("ERROR: pandas not installed.  pip install pandas openpyxl psycopg[binary]")
    sys.exit(1)

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:
    print("ERROR: psycopg not installed.  pip install psycopg[binary]")
    sys.exit(1)


DEFAULT_DSN = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"


# ---------------------------------------------------------------------------
# Status decomposition — 18 combined values → (payment_status, dispute_status)
# ---------------------------------------------------------------------------
PAYMENT_TOKENS = {"OK TO PAY": "OK_TO_PAY", "SCHEDULED": "SCHEDULED", "PAID": "PAID"}

DISPUTE_MAP = {
    "": "NONE",
    "NEED TO DISPUTE":        "NEED_TO_DISPUTE",
    "DISPUTE PENDING":        "DISPUTE_PENDING",
    "DISPUTE APPROVED":       "DISPUTE_APPROVED",
    "DISPUTE REJECTED":       "DISPUTE_REJECTED",
    "NEED TO EMAIL AM":       "NEED_TO_EMAIL_AM",
    "EMAILED AM":             "EMAILED_AM",
    "NEED TO EMAIL CARRIER":  "NEED_TO_EMAIL_CARRIER",
    "EMAILED CARRIER":        "EMAILED_CARRIER",
    "NEED TO EMAIL TERMINAL": "NEED_TO_EMAIL_TERMINAL",
    "EMAILED TERMINAL":       "EMAILED_TERMINAL",
}


def decompose_status(raw: str) -> tuple[str, str]:
    """Split 'PAID/DISPUTE APPROVED' → ('PAID','DISPUTE_APPROVED')."""
    if raw is None or (isinstance(raw, float) and math.isnan(raw)):
        return ("UNPAID", "NONE")
    parts = [p.strip().rstrip("/") for p in str(raw).split("/") if p.strip()]
    payment = "UNPAID"
    dispute_parts = []
    for p in parts:
        if p.upper() in PAYMENT_TOKENS:
            payment = PAYMENT_TOKENS[p.upper()]
        else:
            dispute_parts.append(p.upper())
    dispute_key = "/".join(dispute_parts) if dispute_parts else ""
    dispute = DISPUTE_MAP.get(dispute_key, "NONE")
    return (payment, dispute)


# ---------------------------------------------------------------------------
# Value coercion helpers
# ---------------------------------------------------------------------------
def _clean(val):
    """Convert pandas NaN/NaT to None; trim strings."""
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    if pd.isna(val):
        return None
    if isinstance(val, str):
        s = val.strip()
        return s if s else None
    return val


def to_date(val):
    v = _clean(val)
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(v, fmt).date()
            except ValueError:
                continue
    return None


def to_ts(val):
    v = _clean(val)
    if v is None:
        return None
    if isinstance(v, datetime):
        return v
    if isinstance(v, date):
        return datetime(v.year, v.month, v.day)
    if isinstance(v, str):
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%m/%d/%Y %H:%M", "%m/%d/%Y"):
            try:
                return datetime.strptime(v, fmt)
            except ValueError:
                continue
    return None


def to_num(val):
    v = _clean(val)
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def to_int(val):
    v = to_num(val)
    return int(v) if v is not None else None


def to_str(val):
    v = _clean(val)
    return str(v) if v is not None else None


# ---------------------------------------------------------------------------
# SOA sheet import
# ---------------------------------------------------------------------------
def import_soa(cur, df: pd.DataFrame, source_file: str) -> int:
    inserted = 0
    payment_cols = [c for c in df.columns if c.startswith("Payment")]

    for _, row in df.iterrows():
        inv = to_str(row.get("Invoice Number"))
        if inv is None:
            continue  # blank row
        cur.execute(
            """
            insert into dcli_invoice (
                invoice_number, invoice_date, due_date,
                invoice_amount, invoice_balance, total_payments,
                dispute_pending_amt, dispute_approved_amt, balance, credit_applied,
                vendor_rate_in_tms, notes, source_file, updated_at
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now())
            on conflict (invoice_number) do update set
                invoice_date         = excluded.invoice_date,
                due_date             = excluded.due_date,
                invoice_amount       = excluded.invoice_amount,
                invoice_balance      = excluded.invoice_balance,
                total_payments       = excluded.total_payments,
                dispute_pending_amt  = excluded.dispute_pending_amt,
                dispute_approved_amt = excluded.dispute_approved_amt,
                balance              = excluded.balance,
                credit_applied       = excluded.credit_applied,
                vendor_rate_in_tms   = excluded.vendor_rate_in_tms,
                notes                = excluded.notes,
                source_file          = excluded.source_file,
                updated_at           = now();
            """,
            (
                inv,
                to_date(row.get("Invoice Date")),
                to_date(row.get("Due Date")),
                to_num(row.get("Invoice Amount")),
                to_num(row.get("Invoice Balance")),
                to_num(row.get("Total Payments")),
                to_num(row.get("Dispute Pending")),
                to_num(row.get("Dispute Approved")),
                to_num(row.get("Balance")),
                to_num(row.get("Credit Applied")),
                to_str(row.get("Vendor Rate in TMS")),
                to_str(row.get("NOTES")),
                source_file,
            ),
        )
        inserted += 1

        # Normalize payments (wipe + re-insert for idempotency)
        cur.execute("delete from dcli_invoice_payment where invoice_number = %s", (inv,))
        for seq, pcol in enumerate(payment_cols, start=1):
            amt = to_num(row.get(pcol))
            if amt is None or amt == 0:
                continue
            cur.execute(
                """
                insert into dcli_invoice_payment
                    (invoice_number, payment_label, payment_sequence, amount, source_file)
                values (%s, %s, %s, %s, %s)
                on conflict (invoice_number, payment_label) do update set
                    amount      = excluded.amount,
                    source_file = excluded.source_file;
                """,
                (inv, pcol, seq, amt, source_file),
            )
    return inserted


# ---------------------------------------------------------------------------
# DCLI line items import
# ---------------------------------------------------------------------------
LINE_COLMAP = {
    # source sheet column → target DB column
    "Line #":                            "line_num",
    "Status Date":                       "status_date",
    "Date Entered":                      "date_entered",
    "Invoice Date":                      "invoice_date",
    "Due Date":                          "due_date",
    "Pool":                              "pool",
    "Chassis ":                          "chassis",
    "Container":                         "container",
    "Date Out ":                         "date_out",
    "Date In ":                          "date_in",
    "Bill Days ":                        "bill_days",
    "Use Days":                          "use_days",
    "OG Location":                       "og_location",
    "IG Location":                       "ig_location",
    "IG Container":                      "ig_container",
    "Bill From Date":                    "bill_from_date",
    "Bill To Date":                      "bill_to_date",
    "Rate":                              "rate",
    "Gate Fees":                         "gate_fees",
    "Tax":                               "tax",
    "Total":                             "total",
    "Daily Rate":                        "daily_rate",
    "Days Billed":                       "days_billed",
    "Billed Customer ":                  "billed_customer_amt",
    "Dispute Approved \n($ Amount)":     "dispute_approved_amt",
    "Total Paid to EP \n($ Amount)":     "total_paid_to_ep_amt",
    "Credit Provided by EP ($ Amount)":  "credit_provided_by_ep_amt",
    "Billed to Carrier \n($ Amount)":    "billed_to_carrier_amt",
    "Vendor Credit/Invoice # (NOT a $ Amount)": "vendor_credit_invoice_num",
    "Acct Mgr Paid Carrier\n($ Amount)": "acct_mgr_paid_carrier_amt",
    "Margin":                            "margin",
    "Day Variance":                      "day_variance",
    "Date Expense Added to MG":          "date_expense_added_to_mg",
    "Dispute Date":                      "dispute_date",
    "Dispute Amount":                    "dispute_amount",
    "Dispute#":                          "dispute_num",
    "Dispute Reason":                    "dispute_reason",
    "LD # / PP #":                       "ld_num",
    "SO #":                              "so_num",
    "OG SSL SCAC":                       "og_ssl_scac",
    "OG Carrier SCAC":                   "og_carrier_scac",
    "IG Carrier SCAC":                   "ig_carrier_scac",
    "Notes ":                            "notes",
}


def _lookup_id(cur, table: str, name: str | None) -> int | None:
    if not name:
        return None
    cur.execute(f"select id from {table} where name = %s limit 1", (name,))
    row = cur.fetchone()
    return row["id"] if row else None


def import_lines(cur, df: pd.DataFrame, source_file: str) -> dict:
    stats = {
        "inserted": 0,
        "skipped_no_invoice": 0,
        "missing_invoice_header": set(),
        "unmatched_customers": set(),
        "unmatched_ams": set(),
        "unmatched_categories": set(),
        "unmatched_subcategories": set(),
    }

    # Cache existing invoice numbers to speed up FK check
    cur.execute("select invoice_number from dcli_invoice")
    known_invoices = {r["invoice_number"] for r in cur.fetchall()}

    for src_row_num, (_, row) in enumerate(df.iterrows(), start=2):
        invoice = to_str(row.get("Invoice"))
        if not invoice:
            stats["skipped_no_invoice"] += 1
            continue

        if invoice not in known_invoices:
            # Line references an invoice not in SOA — create a stub header
            # so we don't lose the line, flag it for review.
            cur.execute(
                "insert into dcli_invoice (invoice_number, source_file) values (%s, %s) "
                "on conflict (invoice_number) do nothing",
                (invoice, source_file),
            )
            known_invoices.add(invoice)
            stats["missing_invoice_header"].add(invoice)

        line_num = to_int(row.get("Line #"))
        payment_st, dispute_st = decompose_status(row.get("Status"))

        # Resolve FKs
        cust_name = to_str(row.get("Customer"))
        am_name   = to_str(row.get("Account Manager"))
        cat_name  = to_str(row.get("Charge Absorption Category"))
        sub_name  = to_str(row.get("Charge Absorption Sub Category"))

        cust_id = _lookup_id(cur, "dcli_customer",                        cust_name)
        am_id   = _lookup_id(cur, "dcli_account_manager",                 am_name)
        cat_id  = _lookup_id(cur, "dcli_charge_absorption_category",      cat_name)
        sub_id  = _lookup_id(cur, "dcli_charge_absorption_sub_category",  sub_name)

        if cust_name and cust_id is None:  stats["unmatched_customers"].add(cust_name)
        if am_name   and am_id   is None:  stats["unmatched_ams"].add(am_name)
        if cat_name  and cat_id  is None:  stats["unmatched_categories"].add(cat_name)
        if sub_name  and sub_id  is None:  stats["unmatched_subcategories"].add(sub_name)

        # Build values tuple
        vals = {
            "invoice_number": invoice,
            "line_num": line_num,
            "payment_status": payment_st,
            "dispute_status": dispute_st,
            "charge_absorption_category_id": cat_id,
            "charge_absorption_sub_category_id": sub_id,
            "customer_id": cust_id,
            "account_manager_id": am_id,
            "source_file": source_file,
            "source_row_num": src_row_num,
        }
        # Map remaining simple columns
        for src_col, db_col in LINE_COLMAP.items():
            raw = row.get(src_col)
            if db_col in ("status_date", "date_entered", "invoice_date", "due_date",
                          "date_expense_added_to_mg", "dispute_date"):
                vals[db_col] = to_date(raw)
            elif db_col in ("date_out", "date_in", "bill_from_date", "bill_to_date"):
                vals[db_col] = to_ts(raw)
            elif db_col in ("bill_days", "use_days", "day_variance", "line_num"):
                vals[db_col] = to_int(raw)
            elif db_col in ("rate", "gate_fees", "tax", "total", "daily_rate",
                            "days_billed", "billed_customer_amt", "dispute_approved_amt",
                            "total_paid_to_ep_amt", "credit_provided_by_ep_amt",
                            "billed_to_carrier_amt", "acct_mgr_paid_carrier_amt",
                            "margin", "dispute_amount"):
                vals[db_col] = to_num(raw)
            else:
                vals[db_col] = to_str(raw)

        cols = list(vals.keys())
        placeholders = ", ".join(["%s"] * len(cols))
        col_list = ", ".join(cols)
        update_set = ", ".join(f"{c} = excluded.{c}" for c in cols if c not in ("invoice_number", "line_num"))
        cur.execute(
            f"""
            insert into dcli_invoice_line ({col_list})
            values ({placeholders})
            on conflict (invoice_number, line_num) do update set
              {update_set},
              updated_at = now();
            """,
            [vals[c] for c in cols],
        )
        stats["inserted"] += 1

    return stats


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx_path", help="Path to DCLI_Chassis_Expenses.xlsx")
    ap.add_argument("--dsn", default=os.environ.get("DCLI_DSN", DEFAULT_DSN))
    ap.add_argument("--dry-run", action="store_true", help="Parse only, no DB writes")
    args = ap.parse_args()

    xlsx_path = Path(args.xlsx_path).resolve()
    if not xlsx_path.exists():
        print(f"ERROR: file not found: {xlsx_path}")
        sys.exit(1)

    source_file = xlsx_path.name
    print(f"Reading {xlsx_path}")
    soa_df  = pd.read_excel(xlsx_path, sheet_name="SOA",  header=2)
    line_df = pd.read_excel(xlsx_path, sheet_name="DCLI", header=0)
    print(f"  SOA  sheet: {len(soa_df):>5} rows")
    print(f"  DCLI sheet: {len(line_df):>5} rows")

    if args.dry_run:
        print("\n[dry-run] Exiting without DB writes.")
        return

    with psycopg.connect(args.dsn, row_factory=dict_row, autocommit=False) as conn:
        with conn.cursor() as cur:
            print("\n1/2  Importing SOA → dcli_invoice / dcli_invoice_payment ...")
            n_inv = import_soa(cur, soa_df, source_file)
            print(f"     Upserted {n_inv} invoice header(s).")

            print("\n2/2  Importing DCLI → dcli_invoice_line ...")
            stats = import_lines(cur, line_df, source_file)
            print(f"     Upserted {stats['inserted']} line item(s).")
            print(f"     Skipped {stats['skipped_no_invoice']} row(s) with no invoice.")
        conn.commit()

    # --- Reporting ---
    def _report(label: str, items: set):
        if not items:
            return
        print(f"\n--- {label} ({len(items)}) ---")
        for x in sorted(items):
            print(f"    {x}")

    _report("Line items referencing invoice not in SOA (stub header created)",
            stats["missing_invoice_header"])
    _report("Unmatched customers (line imported with null customer_id)",
            stats["unmatched_customers"])
    _report("Unmatched account managers",       stats["unmatched_ams"])
    _report("Unmatched charge absorption categories", stats["unmatched_categories"])
    _report("Unmatched charge absorption sub-categories", stats["unmatched_subcategories"])

    print("\nDone.")


if __name__ == "__main__":
    main()
