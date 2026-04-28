import { lazy, Suspense } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { ProtectedPage } from '@/components/auth/ProtectedPage'

// Modular Routes
import VendorRoutes from '@/routes/VendorRoutes'
import ChassisRoutes from '@/routes/ChassisRoutes'
import GpsRoutes from '@/routes/GpsRoutes'
import TmsRoutes from '@/routes/TmsRoutes'
import InvoiceRoutes from '@/routes/InvoiceRoutes'

// Auth pages
const Login = lazy(() => import('@/pages/Login'))
const Signup = lazy(() => import('@/pages/Signup'))

// Main & Settings pages
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Settings = lazy(() => import('@/pages/Settings'))
const VendorBCConfigPage = lazy(() => import('@/pages/settings/VendorBCConfig'))
const VendorValidation = lazy(() => import('@/pages/VendorValidation'))
const ActiveLoads = lazy(() => import('@/pages/ActiveLoads'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// Root level features
const ChassisValidation = lazy(() => import('@/pages/ChassisValidation'))
const ChassisUtilization = lazy(() => import('@/pages/ChassisUtilization'))
const ChassisTracker = lazy(() => import('@/pages/ChassisTracker'))
const UnbilledLoadsPage = lazy(() => import('@/features/unbilled-loads/UnbilledLoadsPage'))
const PerDiemPage = lazy(() => import('@/features/perdiem/PerDiemPage'))
const BillingExposurePage = lazy(() => import('@/features/billing-exposure/BillingExposurePage'))
const TerminalEventsPage = lazy(() => import('@/features/terminal-events/TerminalEventsPage'))
const ProvarPage = lazy(() => import('@/pages/ProvarPage'))

// Yards
const YardManagementHub = lazy(() => import('@/pages/YardManagementHub'))
const YardDetail = lazy(() => import('@/pages/YardDetail'))
const YardDashboard = lazy(() => import('@/pages/YardDashboard'))
const YardPage = lazy(() => import('@/pages/YardPage'))

const queryClient = new QueryClient()

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <div className="min-h-screen">
              <Toaster />
              <Sonner />
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Auth routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />

                  {/* Dashboard */}
                  <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />

                  {/* Modular Feature Routes */}
                  <Route path="/chassis/*" element={<ChassisRoutes />} />
                  <Route path="/vendors/*" element={<VendorRoutes />} />
                  <Route path="/gps/*" element={<GpsRoutes />} />
                  <Route path="/tms/*" element={<TmsRoutes />} />
                  <Route path="/invoices/*" element={<InvoiceRoutes />} />

                  {/* Root level features */}
                  <Route path="/validation" element={<ProtectedPage><ChassisValidation /></ProtectedPage>} />
                  <Route path="/utilization" element={<ProtectedPage><ChassisUtilization /></ProtectedPage>} />
                  <Route path="/chassis-tracker" element={<ProtectedPage><ChassisTracker /></ProtectedPage>} />
                  
                  <Route path="/active-loads" element={<ProtectedPage><ActiveLoads /></ProtectedPage>} />
                  <Route path="/unbilled-loads" element={<ProtectedPage><UnbilledLoadsPage /></ProtectedPage>} />
                  <Route path="/perdiem-reconciliation" element={<ProtectedPage><PerDiemPage /></ProtectedPage>} />
                  <Route path="/perdiem" element={<ProtectedPage><PerDiemPage /></ProtectedPage>} />
                  <Route path="/per-diem" element={<ProtectedPage><PerDiemPage /></ProtectedPage>} />
                  <Route path="/billing-exposure" element={<ProtectedPage><BillingExposurePage /></ProtectedPage>} />
                  <Route path="/terminal-events" element={<ProtectedPage><TerminalEventsPage /></ProtectedPage>} />
                  <Route path="/provar" element={<ProtectedPage><ProvarPage /></ProtectedPage>} />

                  {/* Yards */}
                  <Route path="/yard" element={<ProtectedPage><YardManagementHub /></ProtectedPage>} />
                  <Route path="/yard/dashboard" element={<ProtectedPage><YardDashboard /></ProtectedPage>} />
                  <Route path="/yard/:slug" element={<ProtectedPage><YardPage /></ProtectedPage>} />
                  <Route path="/yards/pola" element={<ProtectedPage><YardDetail yardId="PIER S" /></ProtectedPage>} />
                  <Route path="/yards/jedyard" element={<ProtectedPage><YardDetail yardId="JED YARD" /></ProtectedPage>} />

                  {/* Settings / Validation */}
                  <Route path="/vendor-validation" element={<ProtectedPage><VendorValidation /></ProtectedPage>} />
                  <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />
                  <Route path="/settings/bc-export-config" element={<ProtectedPage><VendorBCConfigPage /></ProtectedPage>} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
