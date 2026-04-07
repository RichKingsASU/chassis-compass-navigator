import { Card, CardContent } from '@/components/ui/card'

export interface VendorEmptyStateProps {
  title: string
  message?: string
}

export function VendorEmptyState({ title, message = 'No data available yet.' }: VendorEmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
      </CardContent>
    </Card>
  )
}
