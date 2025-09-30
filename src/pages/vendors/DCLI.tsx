
import React from 'react';
import DCLIDashboard from '../../components/dcli/DCLIDashboard';

const DCLI = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">DCLI Portal</h2>
      </div>
      
      <DCLIDashboard />
    </div>
  );
};

export default DCLI;
