import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileText, Info } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

const ImportantNotices = () => {
  const navigate = useNavigate();

  const { data: invoices } = useQuery({
    queryKey: ['flexivan-notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flexivan_activity')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: disputes } = useQuery({
    queryKey: ['flexivan-disputes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flexivan-dispute')
        .select('*')
        .eq('status', 'open');
      if (error) throw error;
      return data || [];
    }
  });

  const incompleteCount = invoices?.filter(inv => 
    inv.status?.toLowerCase() === 'pending' || inv.status?.toLowerCase() === 'open'
  ).length || 0;

  const overdueCount = invoices?.filter(inv => {
    if (!inv.due_date) return false;
    const dueDate = new Date(inv.due_date);
    const now = new Date();
    return inv.status?.toLowerCase() !== 'paid' && dueDate < now;
  }).length || 0;

  const disputeCount = disputes?.length || 0;

  const totalNotices = incompleteCount + overdueCount + disputeCount + 1;

  const notices = [
    {
      id: 1,
      type: "info",
      title: "New Portal Feature",
      message: "FLEXIVAN portal now supports real-time invoice tracking and dispute management",
      icon: Info,
      action: null
    }
  ];

  if (incompleteCount > 0) {
    notices.push({
      id: 2,
      type: "warning",
      title: "Pending Invoices",
      message: `You have ${incompleteCount} invoice${incompleteCount > 1 ? 's' : ''} pending review`,
      icon: FileText,
      action: () => navigate('/vendors/flexivan')
    });
  }

  if (overdueCount > 0) {
    notices.push({
      id: 3,
      type: "alert",
      title: "Overdue Invoices",
      message: `${overdueCount} invoice${overdueCount > 1 ? 's are' : ' is'} past due date`,
      icon: AlertTriangle,
      action: () => navigate('/vendors/flexivan')
    });
  }

  if (disputeCount > 0) {
    notices.push({
      id: 4,
      type: "alert",
      title: "Active Disputes",
      message: `${disputeCount} dispute${disputeCount > 1 ? 's' : ''} requiring attention`,
      icon: AlertTriangle,
      action: () => navigate('/vendors/flexivan')
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Important Notices</CardTitle>
        <Badge variant="secondary">{totalNotices}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notices.length === 1 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>All invoices up to date</p>
            </div>
          ) : (
            notices.map((notice) => (
              <div
                key={notice.id}
                className={`p-4 rounded-lg border ${
                  notice.type === 'alert'
                    ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                    : notice.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
                    : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <notice.icon
                    className={`h-5 w-5 mt-0.5 ${
                      notice.type === 'alert'
                        ? 'text-red-600 dark:text-red-400'
                        : notice.type === 'warning'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{notice.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{notice.message}</p>
                    {notice.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={notice.action}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportantNotices;
