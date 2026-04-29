import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import type { VendorBCConfig } from '@/hooks/useBCExport'
import { buildDescription } from '@/hooks/useBCExport'

const VENDOR_ORDER = ['dcli', 'ccm', 'trac', 'flexivan', 'wccp', 'scspa']

const DEFAULTS: Omit<VendorBCConfig, 'id' | 'vendor_key' | 'vendor_display_name'> = {
  bc_company: '100',
  bc_type: 'G/L Account',
  bc_gl_account: '511030',
  bc_state: 'CA',
  bc_ops_center: '1000',
  bc_division: '010',
  bc_department: '20',
  bc_description_template: '{vendor} | {date_in} | {chassis} | {so_num}',
  bc_quantity: 1,
  is_active: true,
}

function makeDefault(vendorKey: string): VendorBCConfig {
  return {
    vendor_key: vendorKey,
    vendor_display_name: vendorKey.toUpperCase(),
    ...DEFAULTS,
  }
}

interface VendorCardProps {
  config: VendorBCConfig
  onSaved: (saved: VendorBCConfig) => void
}

function VendorCard({ config, onSaved }: VendorCardProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<VendorBCConfig>(config)

  useEffect(() => {
    setDraft(config)
  }, [config])

  const previewLine = useMemo<{
    chassis: string | null
    date_in: string | null
    so_num: string
    total: number
    id: string
  }>(
    () => ({
      id: 'preview',
      chassis: 'DCLZ421121',
      date_in: '2026-03-23',
      so_num: 'SO270275',
      total: 0,
    }),
    []
  )
  const preview = buildDescription(draft.bc_description_template, draft, previewLine)

  function setField<K extends keyof VendorBCConfig>(key: K, value: VendorBCConfig[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        vendor_key: draft.vendor_key,
        vendor_display_name: draft.vendor_display_name,
        bc_company: draft.bc_company,
        bc_type: draft.bc_type,
        bc_gl_account: draft.bc_gl_account,
        bc_state: draft.bc_state,
        bc_ops_center: draft.bc_ops_center,
        bc_division: draft.bc_division,
        bc_department: draft.bc_department,
        bc_description_template: draft.bc_description_template,
        bc_quantity: draft.bc_quantity,
        is_active: draft.is_active,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await supabase
        .from('vendor_bc_config')
        .upsert(payload, { onConflict: 'vendor_key' })
        .select('*')
        .maybeSingle()
      if (error) throw error
      const saved = (data ?? draft) as VendorBCConfig
      onSaved(saved)
      setDraft(saved)
      setEditing(false)
      toast.success(`${draft.vendor_display_name} BC config saved`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save config')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft(config)
    setEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{config.vendor_display_name}</CardTitle>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] border ${
                config.is_active
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {config.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
            {editing ? (
              <>
                <ChevronUp size={14} /> Hide
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Edit
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!editing ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Company</p>
              <p className="font-mono">{config.bc_company}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-mono">{config.bc_type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">GL Account</p>
              <p className="font-mono">{config.bc_gl_account}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">State</p>
              <p className="font-mono">{config.bc_state}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ops Center</p>
              <p className="font-mono">{config.bc_ops_center}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Division</p>
              <p className="font-mono">{config.bc_division}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="font-mono">{config.bc_department}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="font-mono">{config.bc_quantity}</p>
            </div>
            <div className="col-span-2 md:col-span-4">
              <p className="text-xs text-muted-foreground">Description Template</p>
              <p className="font-mono text-xs break-all">{config.bc_description_template}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor={`${draft.vendor_key}-company`} className="text-xs">
                  Company
                </Label>
                <Input
                  id={`${draft.vendor_key}-company`}
                  value={draft.bc_company}
                  onChange={(e) => setField('bc_company', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`${draft.vendor_key}-type`} className="text-xs">
                  Type
                </Label>
                <Input
                  id={`${draft.vendor_key}-type`}
                  value={draft.bc_type}
                  onChange={(e) => setField('bc_type', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`${draft.vendor_key}-gl`} className="text-xs">
                  GL Account No.
                </Label>
                <Input
                  id={`${draft.vendor_key}-gl`}
                  value={draft.bc_gl_account}
                  onChange={(e) => setField('bc_gl_account', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`${draft.vendor_key}-state`} className="text-xs">
                  State
                </Label>
                <Input
                  id={`${draft.vendor_key}-state`}
                  maxLength={2}
                  value={draft.bc_state}
                  onChange={(e) => setField('bc_state', e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor={`${draft.vendor_key}-ops`} className="text-xs">
                  Ops Center
                </Label>
                <Input
                  id={`${draft.vendor_key}-ops`}
                  value={draft.bc_ops_center}
                  onChange={(e) => setField('bc_ops_center', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`${draft.vendor_key}-division`} className="text-xs">
                  Division
                </Label>
                <Input
                  id={`${draft.vendor_key}-division`}
                  value={draft.bc_division}
                  onChange={(e) => setField('bc_division', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`${draft.vendor_key}-department`} className="text-xs">
                  Department
                </Label>
                <Input
                  id={`${draft.vendor_key}-department`}
                  value={draft.bc_department}
                  onChange={(e) => setField('bc_department', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`${draft.vendor_key}-qty`} className="text-xs">
                  Quantity
                </Label>
                <Input
                  id={`${draft.vendor_key}-qty`}
                  type="number"
                  min={1}
                  value={draft.bc_quantity}
                  onChange={(e) => setField('bc_quantity', Number(e.target.value) || 1)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`${draft.vendor_key}-desc`} className="text-xs">
                Description Template
              </Label>
              <Input
                id={`${draft.vendor_key}-desc`}
                className="font-mono text-sm"
                value={draft.bc_description_template}
                onChange={(e) => setField('bc_description_template', e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Tokens: <code>{'{vendor}'}</code>, <code>{'{date_in}'}</code>,{' '}
                <code>{'{chassis}'}</code>, <code>{'{so_num}'}</code>
              </p>
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <span className="text-muted-foreground">Preview: </span>
                <span className="font-mono">{preview}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id={`${draft.vendor_key}-active`}
                  checked={draft.is_active}
                  onCheckedChange={(v) => setField('is_active', v)}
                />
                <Label htmlFor={`${draft.vendor_key}-active`} className="text-sm">
                  Active
                </Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function VendorBCConfigPage() {
  const [configs, setConfigs] = useState<VendorBCConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('vendor_bc_config')
          .select('*')
          .order('vendor_display_name')
        if (fetchErr) throw fetchErr
        if (cancelled) return
        const fetched = (data ?? []) as VendorBCConfig[]
        const byKey = new Map(fetched.map((c) => [c.vendor_key, c]))
        const ordered = VENDOR_ORDER.map((k) => byKey.get(k) ?? makeDefault(k))
        const extras = fetched.filter((c) => !VENDOR_ORDER.includes(c.vendor_key))
        setConfigs([...ordered, ...extras])
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load BC configs')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  function handleSaved(saved: VendorBCConfig) {
    setConfigs((prev) => {
      const idx = prev.findIndex((c) => c.vendor_key === saved.vendor_key)
      if (idx === -1) return [...prev, saved]
      const next = [...prev]
      next[idx] = saved
      return next
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link
          to="/settings"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-semibold">BC Export Config</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Configure the Business Central export template per equipment vendor. These values populate
        every BC export generated from invoice detail pages.
      </p>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((c) => (
            <VendorCard key={c.vendor_key} config={c} onSaved={handleSaved} />
          ))}
        </div>
      )}
    </div>
  )
}
