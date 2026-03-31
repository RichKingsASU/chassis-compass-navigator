import { useLocation } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function VendorComingSoon() {
  const { pathname } = useLocation()
  const parts = pathname.split('/')
  const vendor = (parts[2] || '').toUpperCase()
  const section = parts[3] ? parts[3].charAt(0).toUpperCase() + parts[3].slice(1) : 'Page'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{vendor} — {section}</h1>
        <p className="text-muted-foreground">This section is under development</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Construction className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground">Coming Soon</h2>
          <p className="text-sm text-muted-foreground/70 mt-2 max-w-md">
            The {section.toLowerCase()} page for {vendor} is currently being built. Check back soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
