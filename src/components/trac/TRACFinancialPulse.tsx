import KPICard from '../ccm/KPICard';

const TRACFinancialPulse = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Invoiced"
        value="$0.00"
        description="Total amount across all invoices"
        icon="dollar"
        change={0}
      />
      <KPICard
        title="Total Invoices"
        value="0"
        description="Number of invoices received"
        icon="file"
        change={0}
      />
      <KPICard
        title="Pending Review"
        value="0"
        description="Invoices awaiting review"
        icon="alert"
        change={0}
      />
      <KPICard
        title="Overdue"
        value="0"
        description="Past due date invoices"
        icon="alert"
        change={0}
      />
    </div>
  );
};

export default TRACFinancialPulse;
