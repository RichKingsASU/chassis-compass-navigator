import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DcliDocumentWithUrl, DcliInvoiceDocument } from '../types'

const LEGACY_BUCKET = 'dcli-invoices'
const NEW_BUCKET = 'invoice-documents'
const SIGNED_URL_TTL_SECONDS = 3600

export interface UseDcliDocumentsResult {
  documents: DcliDocumentWithUrl[]
  loading: boolean
  error: string | null
  refresh: () => void
}

interface InvoiceDocumentRow {
  id: number | string
  invoice_id: string | null
  vendor: string | null
  file_name: string | null
  storage_path: string
  file_type: string | null
  uploaded_at: string | null
  uploaded_by: string | null
}

export function useDcliDocuments(
  invoiceNumber?: string | null
): UseDcliDocumentsResult {
  const [documents, setDocuments] = useState<DcliDocumentWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Legacy DCLI-specific table
        let legacyQuery = supabase
          .from('dcli_invoice_documents')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
        if (invoiceNumber) {
          legacyQuery = legacyQuery.eq('invoice_number', invoiceNumber)
        }
        const { data: legacyData, error: legacyErr } = await legacyQuery
        if (legacyErr) throw legacyErr
        const legacyRows = (legacyData ?? []) as DcliInvoiceDocument[]

        // New vendor-neutral table — silently skip if it doesn't exist
        let newRows: InvoiceDocumentRow[] = []
        try {
          let newQuery = supabase
            .from('invoice_documents')
            .select('*')
            .order('uploaded_at', { ascending: false })
          if (invoiceNumber) {
            newQuery = newQuery.eq('invoice_id', invoiceNumber)
          }
          const { data: newData, error: newErr } = await newQuery
          if (newErr) {
            if (!/does not exist|relation .* does not exist|schema cache/i.test(newErr.message)) {
              throw newErr
            }
          } else {
            newRows = ((newData ?? []) as InvoiceDocumentRow[]).filter(
              (r) => !invoiceNumber || (r.vendor ?? 'dcli').toLowerCase() === 'dcli'
            )
          }
        } catch (innerErr) {
          // table doesn't exist — ignore
          void innerErr
        }

        const legacyWithBucket = legacyRows.map((r) => ({ row: r, bucket: LEGACY_BUCKET }))
        const newWithBucket = newRows.map<{ row: DcliInvoiceDocument; bucket: string }>((r) => ({
          row: {
            id: String(r.id),
            invoice_id: r.invoice_id,
            invoice_number: r.invoice_id,
            storage_path: r.storage_path,
            original_name: r.file_name,
            file_type: r.file_type,
            file_size_bytes: null,
            document_role: null,
            uploaded_by_email: r.uploaded_by,
            created_at: r.uploaded_at ?? new Date().toISOString(),
            deleted_at: null,
          },
          bucket: NEW_BUCKET,
        }))

        const all = [...legacyWithBucket, ...newWithBucket]

        const withUrls = await Promise.all(
          all.map(async ({ row, bucket }): Promise<DcliDocumentWithUrl> => {
            if (!row.storage_path) return { ...row, signed_url: null }
            try {
              const { data: signed } = await supabase.storage
                .from(bucket)
                .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS)
              return { ...row, signed_url: signed?.signedUrl ?? null }
            } catch {
              return { ...row, signed_url: null }
            }
          })
        )

        if (!cancelled) {
          withUrls.sort((a, b) => b.created_at.localeCompare(a.created_at))
          setDocuments(withUrls)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load documents')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [invoiceNumber, refreshKey])

  return { documents, loading, error, refresh: () => setRefreshKey((k) => k + 1) }
}
