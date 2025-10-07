import React from 'react';
import SCSPADashboard from '../../components/scspa/SCSPADashboard';

const SCSPA = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">SCSPA Portal</h2>
      </div>
      
      <SCSPADashboard />
    </div>
  );
};

export default SCSPA;
