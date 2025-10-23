
import React from 'react';
import FLEXIVANDashboard from '../../components/flexivan/FLEXIVANDashboard';

const FLEXIVAN = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">FLEXIVAN Portal</h2>
      </div>
      
      <FLEXIVANDashboard />
    </div>
  );
};

export default FLEXIVAN;
