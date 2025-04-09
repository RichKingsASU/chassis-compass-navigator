
import React from 'react';
import KPICard from '../KPICard';

const DashboardKPIs = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard 
        title="Total Spend" 
        value="$1,245,632" 
        change={+5.2}
        description="Year to date" 
        icon="dollar" 
      />
      <KPICard 
        title="Active Vendors" 
        value="6" 
        description="Currently active" 
        icon="users" 
      />
      <KPICard 
        title="Pending Invoices" 
        value="24" 
        change={-3}
        description="Awaiting review" 
        icon="file" 
      />
      <KPICard 
        title="Disputed Charges" 
        value="$42,587" 
        change={+12}
        description="Currently in dispute" 
        icon="alert" 
      />
    </div>
  );
};

export default DashboardKPIs;
