import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DcliDocumentWithUrl, DcliInvoiceDocument } from '../types'

const STORAGE_BUCKET = 'dcli-invoices'
const SIGNED_URL_TTL_SECONDS = 3600

export interface UseDcliDocumentsResult {
  documents: DcliDocumentWithUrl[]
  loading: boolean
  error: string | null
}

export function useDcliDocuments(
  invoiceNumber?: string | null
): UseDcliDocumentsResult {
  const [documents, setDocuments] = useState<DcliDocumentWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('dcli_invoice_documents')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (invoiceNumber) {
          query = query.eq('invoice_number', invoiceNumber)
        }

        const { data, error: fetchErr } = await query
        if (fetchErr) throw fetchErr
        if (cancelled) return

        const rows = (data ?? []) as DcliInvoiceDocument[]

        const withUrls = await Promise.all(
          rows.map(async (doc): Promise<DcliDocumentWithUrl> => {
            if (!doc.storage_path) return { ...doc, signed_url: null }
            try {
              const { data: signed } = await supabase.storage
                .from(STORAGE_BUCKET)
                .createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SECONDS)
              return { ...doc, signed_url: signed?.signedUrl ?? null }
            } catch {
              return { ...doc, signed_url: null }
            }
          })
        )

        if (!cancelled) setDocuments(withUrls)
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
  }, [invoiceNumber])

  return { documents, loading, error }
}
