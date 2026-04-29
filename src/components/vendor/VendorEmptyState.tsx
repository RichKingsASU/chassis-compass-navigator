import { Card, CardContent } from '@/components/ui/card'
import { Inbox } from 'lucide-react'

export interface VendorEmptyStateProps {
  title: string
  message?: string
}

export function VendorEmptyState({ title, message = 'No operational data has been synchronized yet.' }: VendorEmptyStateProps) {
  return (
    <Card className="border-none shadow-xl bg-muted/20">
      <CardContent className="p-24 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-6 bg-background rounded-full shadow-inner opacity-20">
          <Inbox size={48} strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <p className="text-xl font-black tracking-tight uppercase">{title}</p>
          <p className="text-sm text-muted-foreground max-w-[300px] font-medium leading-relaxed">
            {message}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
