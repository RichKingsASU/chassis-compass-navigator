import { useState } from 'react';

export const useFLEXIVANData = () => {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  return {
    selectedRecord,
    setSelectedRecord,
  };
};
