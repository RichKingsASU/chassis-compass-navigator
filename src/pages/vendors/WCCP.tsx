import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function WCCPPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WCCP</h1>
        <p className="text-muted-foreground">West Coast Chassis Pool — Vendor Dashboard</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-medium">Company:</span> West Coast Chassis Pool (WCCP)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Data Status</CardTitle></CardHeader>
          <CardContent>
            <div className="p-8 text-center border rounded-lg bg-muted/30">
              <p className="text-lg font-medium text-muted-foreground">No invoice table configured yet.</p>
              <p className="text-sm text-muted-foreground mt-1">WCCP activity data will appear here once the data source is connected.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
