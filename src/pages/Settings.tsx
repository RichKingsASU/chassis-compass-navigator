import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [disputeAlerts, setDisputeAlerts] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [signOutLoading, setSignOutLoading] = useState(false)

  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('')
  const [mapsKeySaving, setMapsKeySaving] = useState(false)
  const [mapsKeySaved, setMapsKeySaved] = useState(false)
  const [mapsKeyError, setMapsKeyError] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    async function loadApiKey() {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'google_maps_api_key')
        .single()
      if (data?.value) setGoogleMapsApiKey(data.value)
    }
    loadApiKey()
  }, [])

  async function handleSaveApiKey() {
    setMapsKeySaving(true)
    setMapsKeySaved(false)
    setMapsKeyError(null)
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { key: 'google_maps_api_key', value: googleMapsApiKey.trim() },
          { onConflict: 'key' }
        )
      if (error) throw error
      setMapsKeySaved(true)
      setTimeout(() => setMapsKeySaved(false), 2000)
    } catch (err: unknown) {
      setMapsKeyError(err instanceof Error ? err.message : 'Failed to save API key')
    } finally {
      setMapsKeySaving(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await new Promise(resolve => setTimeout(resolve, 500))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    setSignOutLoading(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function handleDarkModeToggle(checked: boolean) {
    setDarkMode(checked)
    if (checked) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Account Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Application</p><p className="font-medium">Chassis Compass Navigator</p></div>
            <div><p className="text-muted-foreground">Version</p><p className="font-medium">1.0.0</p></div>
            <div><p className="text-muted-foreground">Environment</p><Badge variant="outline">{import.meta.env.MODE}</Badge></div>
            <div><p className="text-muted-foreground">Database</p><Badge variant="default">Supabase</Badge></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="text-sm font-medium">Dark Mode</Label>
              <p className="text-xs text-muted-foreground mt-1">Switch between light and dark themes</p>
            </div>
            <Switch id="dark-mode" checked={darkMode} onCheckedChange={handleDarkModeToggle} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notif" className="text-sm font-medium">Email Notifications</Label>
              <p className="text-xs text-muted-foreground mt-1">Receive email updates for invoice activity</p>
            </div>
            <Switch id="email-notif" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dispute-alerts" className="text-sm font-medium">Dispute Alerts</Label>
              <p className="text-xs text-muted-foreground mt-1">Get notified when disputes are opened or resolved</p>
            </div>
            <Switch id="dispute-alerts" checked={disputeAlerts} onCheckedChange={setDisputeAlerts} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="google-maps-key" className="text-sm font-medium">Google Maps API Key</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Required for the Fleet Map on the Chassis Locator page. Restrict this key to your domain in the Google Cloud Console.
            </p>
            <div className="flex gap-2">
              <Input
                id="google-maps-key"
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter your Google Maps API key"
                value={googleMapsApiKey}
                onChange={e => setGoogleMapsApiKey(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
                className="shrink-0"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </Button>
            </div>
            {mapsKeyError && <p className="text-xs text-destructive mt-1">{mapsKeyError}</p>}
          </div>
          <Button onClick={handleSaveApiKey} disabled={mapsKeySaving || !googleMapsApiKey.trim()} size="sm">
            {mapsKeySaving ? 'Saving...' : mapsKeySaved ? 'Saved!' : 'Save API Key'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Vendors</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {['DCLI', 'CCM', 'TRAC', 'FLEXIVAN', 'WCCP', 'SCSPA'].map(v => (
              <div key={v} className="flex items-center gap-2 p-2 border rounded text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>{v}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </Button>
        <Button variant="destructive" onClick={handleSignOut} disabled={signOutLoading}>
          {signOutLoading ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    </div>
  )
}
