import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import KPICard from '../ccm/KPICard';

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
        description="Total amount across all invoices"
        icon="dollar"
        change={0}
      />
      <KPICard
        title="Total Invoices"
        value={String(invoices?.length || 0)}
        description="Number of invoices received"
        icon="file"
        change={0}
      />
      <KPICard
        title="Pending Review"
        value={String(pendingCount)}
        description="Invoices awaiting review"
        icon="alert"
        change={0}
      />
      <KPICard
        title="Overdue"
        value={String(overdueCount)}
        description="Past due date invoices"
        icon="alert"
        change={0}
      />
    </div>
  );
};

export default TRACFinancialPulse;
