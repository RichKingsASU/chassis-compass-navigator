import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TRACPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">TRAC</h1>
        <p className="text-muted-foreground">TRAC Intermodal — Vendor Dashboard</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-medium">Company:</span> TRAC Intermodal</p>
            <p><span className="font-medium">Website:</span> <a href="https://www.tracintermodal.com" className="text-primary underline" target="_blank" rel="noreferrer">www.tracintermodal.com</a></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Data Status</CardTitle></CardHeader>
          <CardContent>
            <div className="p-8 text-center border rounded-lg bg-muted/30">
              <p className="text-lg font-medium text-muted-foreground">No invoice table configured yet.</p>
              <p className="text-sm text-muted-foreground mt-1">TRAC activity data will appear here once the data source is connected.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
