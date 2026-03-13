import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { parseExcelFile, type ParsedSheet } from '@/utils/excelParser'

interface UploadResult {
  fileUrl: string
  fileName: string
  sheets: ParsedSheet[]
}

export function useInvoiceUpload(bucket: string) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File): Promise<UploadResult | null> => {
    try {
      setUploading(true)
      setError(null)

      const fileExt = file.name.split('.').pop()
      const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

      let sheets: ParsedSheet[] = []
      if (
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv')
      ) {
        sheets = await parseExcelFile(file)
      }

      return {
        fileUrl: urlData.publicUrl,
        fileName: file.name,
        sheets,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
      return null
    } finally {
      setUploading(false)
    }
  }

  return { uploadFile, uploading, error }
}
