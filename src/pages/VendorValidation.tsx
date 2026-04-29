import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'

const VENDORS = [
  { name: 'DCLI', code: 'DCLI', table: 'dcli_activity', route: '/vendors/dcli', description: 'Direct ChassisLink Inc.' },
  { name: 'CCM', code: 'CCM', table: 'ccm_activity', route: '/vendors/ccm', description: 'Consolidated Chassis Management' },
  { name: 'SCSPA', code: 'SCSPA', table: 'scspa_activity', route: '/vendors/scspa', description: 'South Carolina State Ports Authority' },
  { name: 'TRAC', code: 'TRAC', table: 'trac_activity', route: '/vendors/trac', description: 'TRAC Intermodal (no data table yet)' },
  { name: 'FLEXIVAN', code: 'FLEXIVAN', table: 'flexivan_activity', route: '/vendors/flexivan', description: 'Flexi-Van Leasing (no data table yet)' },
  { name: 'WCCP', code: 'WCCP', table: 'wccp_activity', route: '/vendors/wccp', description: 'West Coast Chassis Pool (no data table yet)' },
]

export default function VendorValidation() {
  const { data: vendors = VENDORS.map(v => ({ ...v, totalRecords: 0 })), isLoading } = useQuery({
    queryKey: ['vendor_validation_overview'],
    queryFn: async () => {
      const results = await Promise.all(
        VENDORS.map(async (vendor) => {
          try {
            const { count, error } = await supabase.from(vendor.table).select('id', { count: 'exact', head: true })
            if (error) return { ...vendor, totalRecords: 0 }
            return { ...vendor, totalRecords: count || 0 }
          } catch {
            return { ...vendor, totalRecords: 0 }
          }
        })
      )
      return results
    }
  })

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Vendor Validation</h1>
        <p className="text-muted-foreground mt-2">Overview of all chassis vendor accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {vendors.map((vendor) => (
          <Card key={vendor.code} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{vendor.name}</CardTitle>
                <Badge variant="outline">{vendor.code}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{vendor.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-16 w-full rounded" />
              ) : (
                <div className="p-3 bg-muted rounded text-center">
                  <p className="text-2xl font-bold">{vendor.totalRecords.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Activity Records</p>
                </div>
              )}
              <Link to={vendor.route}>
                <Button className="w-full" variant="outline">View Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
