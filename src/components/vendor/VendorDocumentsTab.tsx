import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function VendorDocumentsTab() {
  return (
    <Card className="p-10 flex flex-col items-center justify-center gap-4 text-center">
      <div>
        <p className="text-lg font-medium">No documents uploaded yet</p>
        <p className="text-sm text-muted-foreground">Upload invoices, contracts, or correspondence to keep them organized.</p>
      </div>
      <Button variant="outline" onClick={() => toast.info('Document upload coming soon')}>
        Upload Document
      </Button>
    </Card>
  )
}
