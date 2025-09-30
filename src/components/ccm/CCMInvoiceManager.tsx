
import React from 'react';
import StorageBucketWarning from './invoice/StorageBucketWarning';

const CCMInvoiceManager: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Storage Bucket Warning */}
      <StorageBucketWarning />
    </div>
  );
};

export default CCMInvoiceManager;
