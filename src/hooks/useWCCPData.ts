import { useState } from 'react';

export const useWCCPData = () => {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  return {
    selectedRecord,
    setSelectedRecord,
  };
};
