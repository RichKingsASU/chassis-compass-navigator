import React from 'react';
import WCCPDashboard from '../../components/wccp/WCCPDashboard';

const WCCP = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">WCCP Portal</h2>
      </div>
      
      <WCCPDashboard />
    </div>
  );
};

export default WCCP;
