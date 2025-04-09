
import React from 'react';

interface GpsProviderHeaderProps {
  providerName: string;
  providerLogo?: string;
}

const GpsProviderHeader: React.FC<GpsProviderHeaderProps> = ({ providerName, providerLogo }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-3">
        {providerLogo && (
          <div className="w-10 h-10 rounded overflow-hidden flex items-center justify-center bg-white p-1">
            <img src={providerLogo} alt={`${providerName} logo`} className="max-w-full max-h-full" />
          </div>
        )}
        <h1 className="dash-title">{providerName} GPS Upload</h1>
      </div>
    </div>
  );
};

export default GpsProviderHeader;
