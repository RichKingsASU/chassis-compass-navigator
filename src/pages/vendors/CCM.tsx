import React from 'react';
import CCMDashboard from '../../components/ccm/CCMDashboard';

const CCM = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">CCM Portal</h2>
      </div>
      
      <CCMDashboard />
    </div>
  );
};

export default CCM;