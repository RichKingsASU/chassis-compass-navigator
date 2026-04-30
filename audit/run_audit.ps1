<#
.SYNOPSIS
    Runs the read-only Supabase / Postgres audit suite against $env:DATABASE_URL
    and writes the results to /audit/output as CSV files.

.DESCRIPTION
    READ-ONLY. The script:
      1. Refuses to run if DATABASE_URL is missing.
      2. Sets the session to default_transaction_read_only = on (defense in depth).
      3. Refuses to execute any SQL file that contains a write keyword
         (INSERT / UPDATE / DELETE / DROP / ALTER / TRUNCATE / CREATE / GRANT /
         REVOKE / VACUUM / REINDEX / COMMENT ON / SECURITY LABEL / COPY ... FROM).
         The only exception is the controlled `CREATE TEMP TABLE` and `DELETE FROM`
         used inside the row-counts DO block (06_row_counts.sql), which are
         restricted to a session-scoped temp table.
      4. Runs each .sql file in /audit/sql in lexical order via psql, capturing
         its output as a CSV in /audit/output.

.USAGE
    From the project root:

        $env:DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
        .\audit\run_audit.ps1

    Optional parameters:
        -PsqlPath  Path to the psql executable (default: 'psql' on PATH)
        -OutputDir Override output directory (default: .\audit\output)
        -SqlDir    Override SQL directory   (default: .\audit\sql)

.NOTES
    Requires psql.exe on PATH (ships with the Postgres client tools and with
    the Supabase CLI's bundled tools). Does not write to the database. Does not
    print row data, only metadata.
#>

[CmdletBinding()]
param(
    [string] $PsqlPath  = 'psql',
    [string] $OutputDir,
    [string] $SqlDir
)

$ErrorActionPreference = 'Stop'

# --- Resolve paths relative to this script ----------------------------------
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $SqlDir)    { $SqlDir    = Join-Path $ScriptRoot 'sql' }
if (-not $OutputDir) { $OutputDir = Join-Path $ScriptRoot 'output' }

# --- Sanity checks ----------------------------------------------------------
if (-not $env:DATABASE_URL -or [string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
    Write-Error @'
DATABASE_URL is not set.

Set it in your shell first, e.g.:

    $env:DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

Then re-run:

    .\audit\run_audit.ps1
'@
    exit 2
}

if (-not (Test-Path -LiteralPath $SqlDir)) {
    Write-Error "SQL directory not found: $SqlDir"
    exit 2
}

# Ensure psql is callable
try {
    $null = & $PsqlPath --version
} catch {
    Write-Error "Could not invoke psql at '$PsqlPath'. Install Postgres client tools or pass -PsqlPath."
    exit 2
}

if (-not (Test-Path -LiteralPath $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# --- Read-only guard: scan every SQL file for forbidden keywords ------------
# We block any *write* statement. The only allowed exceptions are inside
# 06_row_counts.sql, where a session-scoped TEMP table is created and cleared.
$ForbiddenPatterns = @(
    '(?im)^\s*INSERT\s+INTO\b'
    '(?im)^\s*UPDATE\s+\w'
    '(?im)^\s*DELETE\s+FROM\b'
    '(?im)^\s*DROP\b'
    '(?im)^\s*ALTER\b'
    '(?im)^\s*TRUNCATE\b'
    '(?im)^\s*CREATE\s+(?!TEMP\s+TABLE\s+IF\s+NOT\s+EXISTS\s+_audit_)'
    '(?im)^\s*GRANT\b'
    '(?im)^\s*REVOKE\b'
    '(?im)^\s*VACUUM\b'
    '(?im)^\s*REINDEX\b'
    '(?im)^\s*CLUSTER\b'
    '(?im)^\s*COMMENT\s+ON\b'
    '(?im)^\s*SECURITY\s+LABEL\b'
    '(?im)^\s*COPY\s+.*\bFROM\b'
    '(?im)^\s*CALL\b'
    '(?im)\bpg_terminate_backend\b'
    '(?im)\bpg_cancel_backend\b'
)

$SqlFiles = Get-ChildItem -LiteralPath $SqlDir -Filter '*.sql' | Sort-Object Name
if ($SqlFiles.Count -eq 0) {
    Write-Error "No .sql files found in $SqlDir"
    exit 2
}

Write-Host "Scanning $($SqlFiles.Count) SQL file(s) for write statements..." -ForegroundColor Cyan
$violations = @()
foreach ($file in $SqlFiles) {
    # Strip line comments and block comments before scanning
    $raw = Get-Content -LiteralPath $file.FullName -Raw
    $stripped = [regex]::Replace($raw, '/\*[\s\S]*?\*/', '')
    $stripped = [regex]::Replace($stripped, '(?m)--.*$',  '')

    # Whitelist the controlled inserts/deletes/creates inside 06_row_counts.sql
    if ($file.Name -ieq '06_row_counts.sql') {
        $stripped = [regex]::Replace($stripped, '(?im)^\s*CREATE\s+TEMP\s+TABLE\s+IF\s+NOT\s+EXISTS\s+_audit_row_counts[\s\S]*?\)\s*ON\s+COMMIT\s+PRESERVE\s+ROWS\s*;', '')
        $stripped = [regex]::Replace($stripped, '(?im)^\s*DELETE\s+FROM\s+_audit_row_counts\s*;', '')
        $stripped = [regex]::Replace($stripped, '(?im)^\s*INSERT\s+INTO\s+_audit_row_counts[\s\S]*?;', '')
    }

    foreach ($pattern in $ForbiddenPatterns) {
        if ([regex]::IsMatch($stripped, $pattern)) {
            $violations += [pscustomobject]@{ File = $file.Name; Pattern = $pattern }
        }
    }
}

if ($violations.Count -gt 0) {
    Write-Host "Aborting: forbidden write statements detected." -ForegroundColor Red
    $violations | Format-Table -AutoSize | Out-Host
    exit 3
}
Write-Host "All SQL files are read-only. Proceeding." -ForegroundColor Green

# --- Connection string ------------------------------------------------------
# We pass DATABASE_URL as a single argument and rely on PGOPTIONS to enforce
# read-only mode at the server side. We also wrap each file in a transaction
# that has SET TRANSACTION READ ONLY for belt-and-braces safety.
$env:PGOPTIONS = '-c default_transaction_read_only=on -c statement_timeout=0 -c idle_in_transaction_session_timeout=0'

# Quick connectivity probe
Write-Host "Testing connection..." -ForegroundColor Cyan
$probe = & $PsqlPath $env:DATABASE_URL -v ON_ERROR_STOP=1 -At -c 'SELECT current_database(), current_user, version();' 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Connection probe failed:`n$probe"
    exit 4
}
Write-Host ("  -> " + ($probe -join ' | ')) -ForegroundColor DarkGray

# --- Run each SQL file ------------------------------------------------------
$summary = @()
foreach ($file in $SqlFiles) {
    $base    = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $csvOut  = Join-Path $OutputDir ($base + '.csv')
    $logOut  = Join-Path $OutputDir ($base + '.log')

    Write-Host ""
    Write-Host "Running $($file.Name) -> $csvOut" -ForegroundColor Cyan

    # Build a wrapper script that:
    #   - opens a read-only transaction
    #   - \copies the result of the query to a CSV
    # 06_row_counts.sql cannot be wrapped in BEGIN ... COMMIT because its DO block
    # creates a session-scoped TEMP table that we read in a follow-up SELECT.
    # For that file we run it with a session-level SET that keeps it read-only.
    $sqlContent = Get-Content -LiteralPath $file.FullName -Raw

    $wrapper = if ($file.Name -ieq '06_row_counts.sql') {
        @"
\set ON_ERROR_STOP on
SET default_transaction_read_only = on;
$sqlContent
\copy (SELECT * FROM _audit_row_counts ORDER BY schema_name, table_name) TO '$($csvOut.Replace("'","''"))' WITH (FORMAT csv, HEADER true)
"@
    } else {
        # Wrap the file's query in a CTE so we can \copy its result set.
        # We rely on each SQL file ending with a single SELECT terminated by `;`.
        $trimmed = $sqlContent.TrimEnd()
        if ($trimmed.EndsWith(';')) { $trimmed = $trimmed.Substring(0, $trimmed.Length - 1) }

        @"
\set ON_ERROR_STOP on
BEGIN;
SET TRANSACTION READ ONLY;
\copy ($trimmed) TO '$($csvOut.Replace("'","''"))' WITH (FORMAT csv, HEADER true)
COMMIT;
"@
    }

    $tmp = New-TemporaryFile
    try {
        Set-Content -LiteralPath $tmp.FullName -Value $wrapper -Encoding UTF8

        $output = & $PsqlPath $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $tmp.FullName 2>&1
        $exit   = $LASTEXITCODE
        Set-Content -LiteralPath $logOut -Value $output -Encoding UTF8

        if ($exit -ne 0) {
            Write-Host "  FAILED (exit $exit). See $logOut" -ForegroundColor Red
            $summary += [pscustomobject]@{ File = $file.Name; Status = 'FAILED'; Output = $csvOut }
        } else {
            $rowCount = if (Test-Path -LiteralPath $csvOut) { (Get-Content -LiteralPath $csvOut | Measure-Object -Line).Lines - 1 } else { 0 }
            Write-Host "  OK ($rowCount rows)" -ForegroundColor Green
            $summary += [pscustomobject]@{ File = $file.Name; Status = 'OK'; Output = $csvOut; Rows = $rowCount }
        }
    } finally {
        Remove-Item -LiteralPath $tmp.FullName -ErrorAction SilentlyContinue
    }
}

# --- Final summary ----------------------------------------------------------
Write-Host ""
Write-Host "==================== AUDIT SUMMARY ====================" -ForegroundColor Cyan
$summary | Format-Table -AutoSize | Out-Host

$summaryCsv = Join-Path $OutputDir '_summary.csv'
$summary | Export-Csv -LiteralPath $summaryCsv -NoTypeInformation -Encoding UTF8
Write-Host "Summary written to $summaryCsv" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review .\audit\output\*.csv"
Write-Host "  2. Fill in .\audit\report_template.md with findings"
Write-Host "  3. Decide what to keep / modify / remove (do NOT run cleanup yet)"

if ($summary | Where-Object Status -eq 'FAILED') { exit 1 } else { exit 0 }
