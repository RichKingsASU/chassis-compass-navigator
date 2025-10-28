import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateValue } from '@/utils/dateUtils';

interface ActivityHistoryTabProps {
  lineId: number;
}

const ActivityHistoryTab: React.FC<ActivityHistoryTabProps> = ({ lineId }) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activity-history', lineId],
    queryFn: async () => {
      // @ts-ignore - table exists but typed differently
      const { data, error } = await (supabase as any)
        .from('invoice_line_audit')
        .select('*')
        .eq('invoice_line_id', lineId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading activity history...</div>;
  }

  if (!activities || activities.length === 0) {
    return <div className="text-muted-foreground">No activity history available</div>;
  }

  return (
    <div className="space-y-3">
      {activities?.map((activity: any) => (
        <Card key={activity.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-sm">{activity.action}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(activity.created_at).toLocaleString()}
              </span>
            </div>
            {activity.reason && (
              <p className="text-sm text-muted-foreground mb-1">
                Reason: {activity.reason}
              </p>
            )}
            {activity.delta_amount && (
              <p className="text-sm">
                Amount: ${activity.delta_amount}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              By: {activity.created_by || 'System'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ActivityHistoryTab;
