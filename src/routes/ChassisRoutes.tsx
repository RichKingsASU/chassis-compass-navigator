import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedPage } from '@/components/auth/ProtectedPage';

// Main pages
const ChassisManagement = lazy(() => import('@/pages/ChassisManagement'));
const ChassisOverview = lazy(() => import('@/pages/ChassisOverview'));
const LongTermChassis = lazy(() => import('@/pages/LongTermChassis'));
const ShortTermChassis = lazy(() => import('@/pages/ShortTermChassis'));
const ChassisDetail = lazy(() => import('@/pages/ChassisDetail'));
const ChassisLocator = lazy(() => import('@/pages/ChassisLocator'));
const FleetOverview = lazy(() => import('@/pages/FleetOverview'));
const EquipmentBoard = lazy(() => import('@/pages/EquipmentBoard'));
const RepairsAndCosts = lazy(() => import('@/pages/RepairsAndCosts'));

// Loading Fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export default function ChassisRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<ProtectedPage><ChassisManagement /></ProtectedPage>} />
        <Route path="overview" element={<ProtectedPage><ChassisOverview /></ProtectedPage>} />
        <Route path="long-term" element={<ProtectedPage><LongTermChassis /></ProtectedPage>} />
        <Route path="short-term" element={<ProtectedPage><ShortTermChassis /></ProtectedPage>} />
        <Route path="locator" element={<ProtectedPage><ChassisLocator /></ProtectedPage>} />
        <Route path="fleet-overview" element={<ProtectedPage><FleetOverview /></ProtectedPage>} />
        <Route path="equipment-board" element={<ProtectedPage><EquipmentBoard /></ProtectedPage>} />
        <Route path="repairs" element={<ProtectedPage><RepairsAndCosts /></ProtectedPage>} />
        {/* Put :id last to avoid matching static routes like 'overview' */}
        <Route path=":id" element={<ProtectedPage><ChassisDetail /></ProtectedPage>} />
      </Routes>
    </Suspense>
  );
}
