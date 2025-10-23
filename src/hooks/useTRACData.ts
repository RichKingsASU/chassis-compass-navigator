import { useState } from 'react';

export const useTRACData = () => {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  return {
    selectedRecord,
    setSelectedRecord,
  };
};
