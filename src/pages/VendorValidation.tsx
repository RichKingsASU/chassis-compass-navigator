import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface VendorSummary {
  name: string
  code: string
  table: string
  route: string
  description: string
  totalInvoices: number
  pendingCount: number
  totalAmount: number
  loading: boolean
}

const VENDORS = [
  { name: 'DCLI', code: 'DCLI', table: 'dcli_invoice', route: '/vendors/dcli', description: 'Direct ChassisLink Inc.' },
  { name: 'CCM', code: 'CCM', table: 'ccm_invoice', route: '/vendors/ccm', description: 'Consolidated Chassis Management' },
  { name: 'TRAC', code: 'TRAC', table: 'trac_invoice', route: '/vendors/trac', description: 'TRAC Intermodal' },
  { name: 'FLEXIVAN', code: 'FLEXIVAN', table: 'flexivan-invoices', route: '/vendors/flexivan', description: 'Flexi-Van Leasing' },
  { name: 'WCCP', code: 'WCCP', table: 'wccp_invoice', route: '/vendors/wccp', description: 'West Coast Chassis Pool' },
  { name: 'SCSPA', code: 'SCSPA', table: 'scspa_invoice', route: '/vendors/scspa', description: 'South Carolina State Ports Authority' },
]

export default function VendorValidation() {
  const [vendors, setVendors] = useState<VendorSummary[]>(
    VENDORS.map(v => ({ ...v, totalInvoices: 0, pendingCount: 0, totalAmount: 0, loading: true }))
  )

  useEffect(() => {
    async function loadVendorData() {
      const results = await Promise.all(
        VENDORS.map(async (vendor) => {
          try {
            const { data, error } = await supabase.from(vendor.table).select('status, total_amount')
            if (error) throw error
            const invoices = data || []
            return {
              ...vendor,
              totalInvoices: invoices.length,
              pendingCount: invoices.filter((i: { status: string }) => i.status?.toLowerCase() === 'pending').length,
              totalAmount: invoices.reduce((sum: number, i: { total_amount: number }) => sum + (i.total_amount || 0), 0),
              loading: false,
            }
          } catch {
            return { ...vendor, totalInvoices: 0, pendingCount: 0, totalAmount: 0, loading: false }
          }
        })
      )
      setVendors(results)
    }
    loadVendorData()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendor Validation</h1>
        <p className="text-muted-foreground">Overview of all chassis vendor accounts and invoice status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              {vendor.loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-2xl font-bold">{vendor.totalInvoices}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded">
                    <p className="text-2xl font-bold text-yellow-700">{vendor.pendingCount}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-lg font-bold text-blue-700">{formatCurrency(vendor.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
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
