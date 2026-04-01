import type { InventoryRow, AuditIssue } from './types'

const VALID_PREFIXES = [
  'FRQZ', 'MCCZ', 'PTAZ', 'PTSZ', 'PTJZ', 'KFLZ', 'MCHZ', 'MSDU', 'TLLU',
  'ONEU', 'TCLU', 'WHSU', 'DFSU', 'FFAU', 'MRKU', 'MSMU', 'NYKU', 'SEGU',
  'BCHU', 'BEAU', 'BMOU', 'CCLU', 'GCXU', 'HLBU', 'MRSU', 'TGBU', 'TGCU',
  'TGHU', 'TRHU', 'TXGU', 'UACU',
]

const VALID_EQ_TYPES = ['CHZ', 'CON']
const VALID_LOAD_TYPES = ['Unknown', 'Loaded', 'Empty']
const VALID_CARRIERS = ['FRQT', 'ZZZZ']
const VALID_SPOTS = [
  'In Gate Pier S 1', 'In Gate Pier S 2', 'In Gate Pier S 3',
  'In Gate Pier S 5', 'In Gate Pier S 7', 'In Gate Pier S 8',
  'In Gate Pier S 10', 'In Gate Pier S 11', 'Out Gate Pier S 1',
  'PiersClerk', 'Melano, Corina',
]

const COMMENT_CANONICAL: Record<string, string[]> = {
  'PRK CHS IN DL': ['PARK CHS IN DL', 'PRK CHASSIS IN DL', 'PRK CHS IN D/L', 'PARK CHASSIS IN D/L', 'PARK CHS IN D/L'],
  'CHASSIS TO D/L': ['CHASSIS TO THE D/L', 'CHS TO D/L', 'CHASSIS TO DL'],
  'CHASSIS DROP OFF DL8': ['CHASSIS DRP DL8', 'CHS DROP OFF DL8', 'CHASSIS DROPOFF DL8'],
  'BARE CHASSIS DROP': ['FORREST BARE CHASSIS DROP', 'BARE CHS DROP', 'FORREST CHASSIS DROP'],
  'CHASSIS DROP AND WHL OUT': ['CHASSIS DROP AND WHEEL OUT', 'CHS DROP AND WHL OUT'],
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  )
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function findClosest(
  value: string,
  candidates: string[],
  maxDist: number
): string | undefined {
  let best: string | undefined
  let bestDist = maxDist + 1
  for (const c of candidates) {
    const d = levenshtein(value.toUpperCase(), c.toUpperCase())
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  return bestDist <= maxDist ? best : undefined
}

export function runAuditChecks(
  rows: InventoryRow[],
  existingCarriers?: Map<string, string>
): AuditIssue[] {
  const issues: AuditIssue[] = []
  const equipNos = new Map<string, number>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed + header row

    // 13. equip_no is blank/null
    if (!row.equip_no || row.equip_no.trim() === '') {
      issues.push({
        row: rowNum,
        field: 'equip_no',
        value: '',
        severity: 'error',
        message: 'Equipment number is blank or missing',
      })
      continue
    }

    // 1. Duplicate equip_no in same file
    const prevRow = equipNos.get(row.equip_no)
    if (prevRow !== undefined) {
      issues.push({
        row: rowNum,
        field: 'equip_no',
        value: row.equip_no,
        severity: 'error',
        message: `Duplicate equipment number (also on row ${prevRow})`,
      })
    }
    equipNos.set(row.equip_no, rowNum)

    // 2. equip_no format
    const equipNoPattern = /^[A-Z]{4}\d{6,7}$/
    if (!equipNoPattern.test(row.equip_no)) {
      const upper = row.equip_no.toUpperCase()
      if (equipNoPattern.test(upper)) {
        issues.push({
          row: rowNum,
          field: 'equip_no',
          value: row.equip_no,
          severity: 'error',
          message: 'Equipment number has incorrect casing',
          suggestion: upper,
        })
      } else {
        issues.push({
          row: rowNum,
          field: 'equip_no',
          value: row.equip_no,
          severity: 'error',
          message:
            'Equipment number format invalid (expected 4 letters + 6-7 digits)',
        })
      }
    } else {
      // 3. equip_no prefix not in VALID_PREFIXES
      const prefix = row.equip_no.substring(0, 4)
      if (!VALID_PREFIXES.includes(prefix)) {
        const suggestion = findClosest(prefix, VALID_PREFIXES, 1)
        issues.push({
          row: rowNum,
          field: 'equip_no',
          value: prefix,
          severity: 'warning',
          message: `Unknown equipment prefix "${prefix}"`,
          suggestion: suggestion
            ? `Did you mean "${suggestion}"?`
            : undefined,
        })
      }
    }

    // 4. eq_type not in VALID_EQ_TYPES
    if (row.eq_type != null && !VALID_EQ_TYPES.includes(row.eq_type)) {
      issues.push({
        row: rowNum,
        field: 'eq_type',
        value: row.eq_type,
        severity: 'error',
        message: `Invalid equipment type "${row.eq_type}" (expected CHZ or CON)`,
      })
    }

    // 5. load_type not in VALID_LOAD_TYPES
    if (row.load_type != null) {
      if (!VALID_LOAD_TYPES.includes(row.load_type)) {
        const match = VALID_LOAD_TYPES.find(
          (lt) => lt.toLowerCase() === row.load_type!.toLowerCase()
        )
        issues.push({
          row: rowNum,
          field: 'load_type',
          value: row.load_type,
          severity: 'warning',
          message: `Invalid load type "${row.load_type}"`,
          suggestion: match ? `Did you mean "${match}"?` : undefined,
        })
      }
    }

    // 6. days_onsite < 0
    if (row.days_onsite != null && row.days_onsite < 0) {
      issues.push({
        row: rowNum,
        field: 'days_onsite',
        value: String(row.days_onsite),
        severity: 'error',
        message: 'Days onsite cannot be negative',
      })
    }

    // 7. days_onsite > 90
    if (row.days_onsite != null && row.days_onsite > 90) {
      issues.push({
        row: rowNum,
        field: 'days_onsite',
        value: String(row.days_onsite),
        severity: 'warning',
        message: `Equipment on site for ${row.days_onsite} days — flag for review`,
      })
    }
    // 8. days_onsite > 30 (but not if already flagged at 90)
    else if (row.days_onsite != null && row.days_onsite > 30) {
      issues.push({
        row: rowNum,
        field: 'days_onsite',
        value: String(row.days_onsite),
        severity: 'info',
        message: `Extended dwell time: ${row.days_onsite} days`,
      })
    }

    // 9. resource_name not in VALID_SPOTS
    if (row.resource_name != null && !VALID_SPOTS.includes(row.resource_name)) {
      const suggestion = findClosest(row.resource_name, VALID_SPOTS, 2)
      issues.push({
        row: rowNum,
        field: 'resource_name',
        value: row.resource_name,
        severity: 'warning',
        message: `Unknown spot/resource "${row.resource_name}"`,
        suggestion: suggestion ? `Did you mean "${suggestion}"?` : undefined,
      })
    }

    // 10. comment non-canonical
    if (row.comment != null) {
      const upper = row.comment.toUpperCase().trim()
      for (const [canonical, variants] of Object.entries(COMMENT_CANONICAL)) {
        for (const variant of variants) {
          if (upper === variant.toUpperCase()) {
            issues.push({
              row: rowNum,
              field: 'comment',
              value: row.comment,
              severity: 'info',
              message: 'Non-canonical comment phrasing',
              suggestion: `Canonical form: "${canonical}"`,
            })
            break
          }
        }
      }
    }

    // 11. last_carrier not in VALID_CARRIERS
    if (
      row.last_carrier != null &&
      row.last_carrier.trim() !== '' &&
      !VALID_CARRIERS.includes(row.last_carrier)
    ) {
      issues.push({
        row: rowNum,
        field: 'last_carrier',
        value: row.last_carrier,
        severity: 'warning',
        message: `Unknown carrier code "${row.last_carrier}"`,
      })
    }

    // 12. last_gate_in_time validation
    if (row.last_gate_in_time != null) {
      const t = row.last_gate_in_time
      if (!Number.isInteger(t)) {
        issues.push({
          row: rowNum,
          field: 'last_gate_in_time',
          value: String(t),
          severity: 'error',
          message: 'Gate-in time must be an integer',
        })
      } else if (t < 0 || t > 2359) {
        issues.push({
          row: rowNum,
          field: 'last_gate_in_time',
          value: String(t),
          severity: 'error',
          message: 'Gate-in time must be between 0 and 2359',
        })
      } else if (t % 100 > 59) {
        issues.push({
          row: rowNum,
          field: 'last_gate_in_time',
          value: String(t),
          severity: 'error',
          message: 'Gate-in time minutes portion must be 0-59',
        })
      }
    }

    // 14. Cross-file check: carrier name mismatch
    if (
      existingCarriers &&
      row.equip_no &&
      row.last_carrier_name != null
    ) {
      const existing = existingCarriers.get(row.equip_no)
      if (existing && existing !== row.last_carrier_name) {
        issues.push({
          row: rowNum,
          field: 'last_carrier_name',
          value: row.last_carrier_name,
          severity: 'warning',
          message: `Carrier name differs from existing record ("${existing}")`,
          suggestion: `Previous: "${existing}", Current: "${row.last_carrier_name}"`,
        })
      }
    }

    // 15. CON with Unknown load type
    if (row.eq_type === 'CON' && row.load_type === 'Unknown') {
      issues.push({
        row: rowNum,
        field: 'load_type',
        value: 'Unknown',
        severity: 'info',
        message: 'Container has unknown load state — should be Loaded or Empty',
      })
    }

    // 16. booking_no format check
    if (row.booking_no != null && row.booking_no.trim() !== '') {
      const bookingPattern = /^\d{7,10}$/
      if (!bookingPattern.test(row.booking_no)) {
        issues.push({
          row: rowNum,
          field: 'booking_no',
          value: row.booking_no,
          severity: 'info',
          message: 'Booking number has unexpected format (expected 7-10 digits)',
        })
      }
    }
  }

  return issues
}
