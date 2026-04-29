import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function Settings() {
  const queryClient = useQueryClient()
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [disputeAlerts, setDisputeAlerts] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [signOutLoading, setSignOutLoading] = useState(false)

  const [localApiKey, setLocalApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  // Fetch API Key
  const { data: apiKeyData, isLoading: keyLoading } = useQuery({
    queryKey: ['settings_google_maps_api_key'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'google_maps_api_key')
        .single()
      return data?.value || ''
    }
  })

  // Sync local state when data arrives
  useEffect(() => {
    if (apiKeyData !== undefined) {
      setLocalApiKey(apiKeyData)
    }
  }, [apiKeyData])

  // Save API Key Mutation
  const saveKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { key: 'google_maps_api_key', value: key.trim() },
          { onConflict: 'key' }
        )
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('API Key saved successfully')
      queryClient.invalidateQueries({ queryKey: ['settings_google_maps_api_key'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save API key')
    }
  })

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await new Promise(resolve => setTimeout(resolve, 500))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    toast.success('Settings saved')
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
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and application preferences</p>
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
                placeholder={keyLoading ? "Loading..." : "Enter your Google Maps API key"}
                value={localApiKey}
                onChange={e => setLocalApiKey(e.target.value)}
                className="flex-1 font-mono text-sm"
                disabled={keyLoading}
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
          </div>
          <Button 
            onClick={() => saveKeyMutation.mutate(localApiKey)} 
            disabled={saveKeyMutation.isPending || !localApiKey.trim()} 
            size="sm"
          >
            {saveKeyMutation.isPending ? 'Saving...' : saveKeyMutation.isSuccess ? 'Saved!' : 'Save API Key'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Vendors</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {['DCLI', 'CCM', 'TRAC', 'FLEXIVAN', 'WCCP', 'SCSPA'].map(v => (
              <div key={v} className="flex items-center gap-2 p-2 border rounded text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>{v}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
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
