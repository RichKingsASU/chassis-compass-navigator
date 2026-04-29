import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedPage } from '@/components/auth/ProtectedPage';

// TMS pages
const TMSData = lazy(() => import('@/pages/TMSData'));
const MercuryGate = lazy(() => import('@/pages/tms/MercuryGate'));
const PortPro = lazy(() => import('@/pages/tms/PortPro'));

// Loading Fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export default function TmsRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<ProtectedPage><TMSData /></ProtectedPage>} />
        <Route path="mercury-gate" element={<ProtectedPage><MercuryGate /></ProtectedPage>} />
        <Route path="port-pro" element={<ProtectedPage><PortPro /></ProtectedPage>} />
      </Routes>
    </Suspense>
  );
}
