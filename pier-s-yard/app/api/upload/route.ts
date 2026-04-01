import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { parseExcel } from '@/lib/parseExcel'
import { runAuditChecks } from '@/lib/auditRules'
import type { UploadResult } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'File must be an Excel file (.xlsx or .xls)' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // 1. Parse the Excel file
    const buffer = await file.arrayBuffer()
    const rows = parseExcel(buffer, file.name)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No data rows found in file' },
        { status: 400 }
      )
    }

    // 2. Fetch existing carrier names for cross-file check (audit rule 14)
    const equipNos = rows
      .filter((r) => r.equip_no)
      .map((r) => r.equip_no)
    const { data: existingRows } = await supabase
      .from('piers_equipment_inventory')
      .select('equip_no, last_carrier_name')
      .in('equip_no', equipNos)

    const existingCarriers = new Map<string, string>()
    if (existingRows) {
      for (const r of existingRows) {
        if (r.last_carrier_name) {
          existingCarriers.set(r.equip_no, r.last_carrier_name)
        }
      }
    }

    // 3. Run audit checks
    const issues = runAuditChecks(rows, existingCarriers)

    // 4. Upload raw file to Supabase Storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const storagePath = `snapshots/${timestamp}_${file.name}`

    const { error: storageError } = await supabase.storage
      .from('pier-s-yard')
      .upload(storagePath, buffer, {
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: false,
      })

    if (storageError) {
      console.error('Storage upload error:', storageError)
      return NextResponse.json(
        { error: `Storage upload failed: ${storageError.message}` },
        { status: 500 }
      )
    }

    // 5. Upsert rows into piers_equipment_inventory
    // Filter out rows with blank equip_no (can't upsert without it)
    const validRows = rows.filter((r) => r.equip_no && r.equip_no.trim() !== '')

    const { error: upsertError } = await supabase
      .from('piers_equipment_inventory')
      .upsert(
        validRows.map((r) => ({
          equip_group_id: r.equip_group_id,
          eq_type: r.eq_type,
          equip_no: r.equip_no,
          size: r.size,
          iso_code: r.iso_code,
          cust_code: r.cust_code,
          lic_no: r.lic_no,
          lic_state: r.lic_state,
          last_gate_in_date: r.last_gate_in_date,
          last_gate_in_time: r.last_gate_in_time,
          load_type: r.load_type,
          last_carrier: r.last_carrier,
          last_carrier_name: r.last_carrier_name,
          booking_no: r.booking_no,
          days_onsite: r.days_onsite,
          comment: r.comment,
          resource_name: r.resource_name,
          source_file: r.source_file,
          uploaded_at: new Date().toISOString(),
        })),
        { onConflict: 'equip_no,last_gate_in_time' }
      )

    if (upsertError) {
      console.error('Upsert error:', upsertError)
      return NextResponse.json(
        { error: `Database upsert failed: ${upsertError.message}` },
        { status: 500 }
      )
    }

    // 6. Write upload log
    const errorCount = issues.filter((i) => i.severity === 'error').length
    const warningCount = issues.filter((i) => i.severity === 'warning').length
    const infoCount = issues.filter((i) => i.severity === 'info').length

    const { data: logData, error: logError } = await supabase
      .from('pier_s_upload_log')
      .insert({
        file_name: file.name,
        storage_path: storagePath,
        row_count: validRows.length,
        error_count: errorCount,
        warning_count: warningCount,
        info_count: infoCount,
        audit_results: issues,
      })
      .select('id')
      .single()

    if (logError) {
      console.error('Log insert error:', logError)
    }

    // 7. Return result
    const result: UploadResult = {
      storagePath,
      rowsUpserted: validRows.length,
      issues,
      uploadLogId: logData?.id ?? 0,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
