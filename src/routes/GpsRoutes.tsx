import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedPage } from '@/components/auth/ProtectedPage';

// GPS Provider pages
const GpsOverview = lazy(() => import('@/pages/GpsOverview'));
const GpsFleetMap = lazy(() => import('@/pages/gps/GpsFleetMap'));
const GpsAnalytics = lazy(() => import('@/pages/gps/GpsAnalytics'));
const Samsara = lazy(() => import('@/pages/gps/Samsara'));
const BlackBerry = lazy(() => import('@/pages/gps/BlackBerry'));
const Fleetview = lazy(() => import('@/pages/gps/Fleetview'));
const Fleetlocate = lazy(() => import('@/pages/gps/Fleetlocate'));
const Anytrek = lazy(() => import('@/pages/gps/Anytrek'));

// Loading Fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export default function GpsRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<ProtectedPage><GpsOverview /></ProtectedPage>} />
        <Route path="fleet-map" element={<ProtectedPage><GpsFleetMap /></ProtectedPage>} />
        <Route path="analytics" element={<ProtectedPage><GpsAnalytics /></ProtectedPage>} />
        <Route path="samsara" element={<ProtectedPage><Samsara /></ProtectedPage>} />
        <Route path="blackberry" element={<ProtectedPage><BlackBerry /></ProtectedPage>} />
        <Route path="fleetview" element={<ProtectedPage><Fleetview /></ProtectedPage>} />
        <Route path="fleetlocate" element={<ProtectedPage><Fleetlocate /></ProtectedPage>} />
        <Route path="anytrek" element={<ProtectedPage><Anytrek /></ProtectedPage>} />
      </Routes>
    </Suspense>
  );
}
