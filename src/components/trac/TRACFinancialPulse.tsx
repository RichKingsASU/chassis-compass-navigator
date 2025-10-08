import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import KPICard from '../ccm/KPICard';
import { DollarSign, TrendingUp, AlertCircle, Clock } from 'lucide-react';

const TRACFinancialPulse = () => {
  const { data: invoices } = useQuery({
    queryKey: ['trac-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trac_invoice')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  const totalInvoiced = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount_usd || 0), 0) || 0;
  const pendingCount = invoices?.filter(inv => inv.status === 'pending').length || 0;
  const overdueCount = invoices?.filter(inv => {
    if (!inv.due_date) return false;
    return new Date(inv.due_date) < new Date() && inv.status !== 'paid';
  }).length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Invoiced"
        value={`$${totalInvoiced.toLocaleString()}`}
        icon={DollarSign}
        trend={{ value: 0, isPositive: true }}
      />
      <KPICard
        title="Total Invoices"
        value={invoices?.length || 0}
        icon={TrendingUp}
        trend={{ value: 0, isPositive: true }}
      />
      <KPICard
        title="Pending Review"
        value={pendingCount}
        icon={Clock}
        trend={{ value: 0, isPositive: false }}
      />
      <KPICard
        title="Overdue"
        value={overdueCount}
        icon={AlertCircle}
        trend={{ value: 0, isPositive: false }}
      />
    </div>
  );
};

export default TRACFinancialPulse;
