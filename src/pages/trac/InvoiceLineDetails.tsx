import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, AlertTriangle, CheckCircle2, ShieldAlert, History, Info } from 'lucide-react'

interface LineItem {
  id: string
  invoice_id: string
  chassis_number: string
  container_number: string
  pickup_date: string
  return_date: string
  days: number
  rate: number
  amount: number
  status: string
  tms_match: boolean
  tms_ld_number: string
  variance_days: number
  variance_amount: number
  dispute_reason: string
}

export default function TRACInvoiceLineDetails() {
  const { lineId } = useParams<{ lineId: string }>()
  const navigate = useNavigate()

  const { data: line, isLoading, error } = useQuery({
    queryKey: ['trac_invoice_data_line', lineId],
    queryFn: async () => {
      if (!lineId) return null
      const { data, error } = await supabase.from('trac_invoice_data').select('*').eq('id', lineId).single()
      if (error) throw error
      return data as LineItem
    },
    enabled: !!lineId
  })

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
          <AlertTriangle size={20} />
          <p className="font-medium">{error instanceof Error ? error.message : 'Synchronization error'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft size={14} /> Back
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Line Artifact</h1>
            {isLoading ? <Skeleton className="h-6 w-24" /> : (
              <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest px-3 py-1 bg-primary/5 text-primary border-primary/20">
                {line?.status || 'STAGED'}
              </Badge>
            )}
          </div>
        </div>
        {!isLoading && line && (
          <div className="flex gap-3">
            <Link to={`/vendors/trac/invoices/${line.invoice_id}/review`}>
              <Button variant="outline" className="gap-2 font-bold h-11">
                Parent Invoice <ExternalLink size={16} />
              </Button>
            </Link>
            <Link to={`/trac/line/${line.id}/dispute`}>
              <Button variant="destructive" className="gap-2 font-bold h-11 shadow-lg shadow-destructive/20">
                <ShieldAlert size={18} strokeWidth={3} /> Escalate Dispute
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Core Data Card */}
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info size={18} className="text-primary" /> Vendor Payload Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-8">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : line && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Asset Reference (Chassis)</p>
                    <p className="text-xl font-black font-mono tracking-tight">{line.chassis_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cargo Reference (Container)</p>
                    <p className="text-xl font-black font-mono tracking-tight text-muted-foreground">{line.container_number || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Utilization Cycle</p>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground">OUT</span>
                        <span className="text-sm font-bold">{formatDate(line.pickup_date)}</span>
                      </div>
                      <div className="h-px flex-1 bg-muted border-t border-dashed" />
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-muted-foreground">IN</span>
                        <span className="text-sm font-bold">{formatDate(line.return_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Valuation Model</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black">{line.days} Days</p>
                      <span className="text-muted-foreground text-xs font-bold">@ {formatCurrency(line.rate)}/day</span>
                    </div>
                  </div>
                  <div className="md:col-span-2 pt-6 border-t border-muted-foreground/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Line Valuation</p>
                      <p className="text-3xl font-black text-primary">{formatCurrency(line.amount)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dispute Context */}
          {line?.dispute_reason && (
            <Card className="border-none shadow-xl bg-destructive/5 border-l-4 border-l-destructive">
              <CardHeader className="bg-destructive/10 border-b border-destructive/10 py-4">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <ShieldAlert size={18} /> Active Dispute Context
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm font-medium leading-relaxed italic text-destructive/80">
                  "{line.dispute_reason}"
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          {/* TMS Intelligence */}
          <Card className={`border-none shadow-xl overflow-hidden ${line?.tms_match ? 'bg-emerald-500/[0.03]' : 'bg-destructive/5'}`}>
            <CardHeader className={`border-b py-4 ${line?.tms_match ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 size={18} className={line?.tms_match ? 'text-emerald-600' : 'text-muted-foreground opacity-20'} /> TMS Correlation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {isLoading ? <Skeleton className="h-40 w-full" /> : (
                <>
                  <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${line?.tms_match ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-800' : 'border-destructive/20 bg-destructive/5 text-destructive'}`}>
                    {line?.tms_match ? <CheckCircle2 size={20} strokeWidth={3} /> : <AlertTriangle size={20} strokeWidth={3} />}
                    <span className="text-xs font-black uppercase tracking-widest">
                      {line?.tms_match ? 'High-Confidence Match' : 'No Correlation Found'}
                    </span>
                  </div>

                  {line?.tms_match && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Internal Reference (LD#)</p>
                        <p className="text-lg font-black font-mono text-emerald-700">{line.tms_ld_number}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-background rounded-lg border-2 shadow-sm space-y-1">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Cycle Drift</p>
                          <p className={`text-sm font-black ${line.variance_days ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {line.variance_days ? `${line.variance_days} Days` : 'Aligned'}
                          </p>
                        </div>
                        <div className="p-3 bg-background rounded-lg border-2 shadow-sm space-y-1">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Financial Drift</p>
                          <p className={`text-sm font-black ${line.variance_amount ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {line.variance_amount ? formatCurrency(line.variance_amount) : 'Aligned'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity Log Placeholder */}
          <Card className="border-none shadow-md bg-muted/20">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <History size={14} /> Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-50">Log stream pending integration</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
