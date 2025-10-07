
import React from 'react';
import TRACDashboard from '../../components/trac/TRACDashboard';

const TRAC = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">TRAC Portal</h2>
      </div>
      
      <TRACDashboard />
    </div>
  );
};

export default TRAC;
