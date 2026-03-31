import { lazy, Suspense } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Auth pages
const Login = lazy(() => import('@/pages/Login'))
const Signup = lazy(() => import('@/pages/Signup'))

// Main pages
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ChassisManagement = lazy(() => import('@/pages/ChassisManagement'))
const ChassisOverview = lazy(() => import('@/pages/ChassisOverview'))
const LongTermChassis = lazy(() => import('@/pages/LongTermChassis'))
const ShortTermChassis = lazy(() => import('@/pages/ShortTermChassis'))
const ChassisDetail = lazy(() => import('@/pages/ChassisDetail'))
const ChassisLocator = lazy(() => import('@/pages/ChassisLocator'))
const ChassisValidation = lazy(() => import('@/pages/ChassisValidation'))
const ChassisUtilization = lazy(() => import('@/pages/ChassisUtilization'))
const TMSData = lazy(() => import('@/pages/TMSData'))
const GpsOverview = lazy(() => import('@/pages/GpsOverview'))
const Settings = lazy(() => import('@/pages/Settings'))
const VendorValidation = lazy(() => import('@/pages/VendorValidation'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// GPS Provider pages
const Samsara = lazy(() => import('@/pages/gps/Samsara'))
const BlackBerry = lazy(() => import('@/pages/gps/BlackBerry'))
const Fleetview = lazy(() => import('@/pages/gps/Fleetview'))
const Fleetlocate = lazy(() => import('@/pages/gps/Fleetlocate'))
const Anytrek = lazy(() => import('@/pages/gps/Anytrek'))

// TMS pages
const MercuryGate = lazy(() => import('@/pages/tms/MercuryGate'))
const PortPro = lazy(() => import('@/pages/tms/PortPro'))

// Yard pages
const YardManagementHub = lazy(() => import('@/pages/YardManagementHub'))

// Vendor pages
const DCLI = lazy(() => import('@/pages/vendors/DCLI'))
const CCM = lazy(() => import('@/pages/vendors/CCM'))
const TRAC = lazy(() => import('@/pages/vendors/TRAC'))
const FLEXIVAN = lazy(() => import('@/pages/vendors/FLEXIVAN'))
const WCCP = lazy(() => import('@/pages/vendors/WCCP'))
const SCSPA = lazy(() => import('@/pages/vendors/SCSPA'))

// DCLI invoice pages
const DCLINewInvoice = lazy(() => import('@/pages/dcli/NewInvoice'))
const DCLIInvoiceReview = lazy(() => import('@/pages/dcli/InvoiceReview'))
const DCLIInvoiceDetail = lazy(() => import('@/pages/dcli/InvoiceDetail'))
const DCLIInvoiceTracker = lazy(() => import('@/pages/dcli/InvoiceTracker'))
const DCLIInvoiceLineDetails = lazy(() => import('@/pages/dcli/InvoiceLineDetails'))
const DCLIInvoiceLineDispute = lazy(() => import('@/pages/dcli/InvoiceLineDispute'))

// CCM invoice pages
const CCMNewInvoice = lazy(() => import('@/pages/ccm/NewInvoice'))
const CCMInvoiceLineDetails = lazy(() => import('@/pages/ccm/InvoiceLineDetails'))

// TRAC invoice pages
const TRACNewInvoice = lazy(() => import('@/pages/trac/NewInvoice'))
const TRACInvoiceReview = lazy(() => import('@/pages/trac/InvoiceReview'))
const TRACInvoiceValidate = lazy(() => import('@/pages/trac/InvoiceValidate'))
const TRACInvoiceLineDetails = lazy(() => import('@/pages/trac/InvoiceLineDetails'))
const TRACInvoiceLineDispute = lazy(() => import('@/pages/trac/InvoiceLineDispute'))

// WCCP invoice pages
const WCCPNewInvoice = lazy(() => import('@/pages/wccp/NewInvoice'))
const WCCPInvoiceReview = lazy(() => import('@/pages/wccp/InvoiceReview'))
const WCCPInvoiceLineDetails = lazy(() => import('@/pages/wccp/InvoiceLineDetails'))
const WCCPInvoiceLineDispute = lazy(() => import('@/pages/wccp/InvoiceLineDispute'))

// FLEXIVAN/SCSPA invoice pages
const FLEXIVANNewInvoice = lazy(() => import('@/pages/flexivan/NewInvoice'))
const SCSPANewInvoice = lazy(() => import('@/pages/scspa/NewInvoice'))

// Generic invoice pages
const InvoicesList = lazy(() => import('@/pages/invoices/InvoicesList'))
const InvoiceLineDetails = lazy(() => import('@/pages/invoices/InvoiceLineDetails'))
const InvoiceLineDispute = lazy(() => import('@/pages/invoices/InvoiceLineDispute'))

const queryClient = new QueryClient()

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
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

                  {/* Chassis */}
                  <Route path="/chassis" element={<ProtectedPage><ChassisManagement /></ProtectedPage>} />
                  <Route path="/chassis/overview" element={<ProtectedPage><ChassisOverview /></ProtectedPage>} />
                  <Route path="/chassis/long-term" element={<ProtectedPage><LongTermChassis /></ProtectedPage>} />
                  <Route path="/chassis/short-term" element={<ProtectedPage><ShortTermChassis /></ProtectedPage>} />
                  <Route path="/chassis/:id" element={<ProtectedPage><ChassisDetail /></ProtectedPage>} />
                  <Route path="/chassis/locator" element={<ProtectedPage><ChassisLocator /></ProtectedPage>} />
                  <Route path="/validation" element={<ProtectedPage><ChassisValidation /></ProtectedPage>} />
                  <Route path="/utilization" element={<ProtectedPage><ChassisUtilization /></ProtectedPage>} />

                  {/* TMS */}
                  <Route path="/tms" element={<ProtectedPage><TMSData /></ProtectedPage>} />
                  <Route path="/tms/mercury-gate" element={<ProtectedPage><MercuryGate /></ProtectedPage>} />
                  <Route path="/tms/port-pro" element={<ProtectedPage><PortPro /></ProtectedPage>} />

                  {/* Yards */}
                  <Route path="/yard" element={<ProtectedPage><YardManagementHub /></ProtectedPage>} />

                  {/* GPS */}
                  <Route path="/gps" element={<ProtectedPage><GpsOverview /></ProtectedPage>} />
                  <Route path="/gps/samsara" element={<ProtectedPage><Samsara /></ProtectedPage>} />
                  <Route path="/gps/blackberry" element={<ProtectedPage><BlackBerry /></ProtectedPage>} />
                  <Route path="/gps/fleetview" element={<ProtectedPage><Fleetview /></ProtectedPage>} />
                  <Route path="/gps/fleetlocate" element={<ProtectedPage><Fleetlocate /></ProtectedPage>} />
                  <Route path="/gps/anytrek" element={<ProtectedPage><Anytrek /></ProtectedPage>} />

                  {/* Vendors */}
                  <Route path="/vendor-validation" element={<ProtectedPage><VendorValidation /></ProtectedPage>} />
                  <Route path="/vendors/dcli" element={<ProtectedPage><DCLI /></ProtectedPage>} />
                  <Route path="/vendors/dcli/invoices" element={<ProtectedPage><DCLIInvoiceTracker /></ProtectedPage>} />
                  <Route path="/vendors/dcli/invoices/new" element={<ProtectedPage><DCLINewInvoice /></ProtectedPage>} />
                  <Route path="/vendors/dcli/invoices/tracker" element={<ProtectedPage><DCLIInvoiceTracker /></ProtectedPage>} />
                  <Route path="/vendors/dcli/invoices/:invoiceId/review" element={<ProtectedPage><DCLIInvoiceReview /></ProtectedPage>} />
                  <Route path="/vendors/dcli/invoices/:invoiceId/detail" element={<ProtectedPage><DCLIInvoiceDetail /></ProtectedPage>} />
                  <Route path="/vendors/dcli/invoice-line/:lineId" element={<ProtectedPage><DCLIInvoiceLineDetails /></ProtectedPage>} />
                  <Route path="/vendors/dcli/invoice-line/:lineId/dispute" element={<ProtectedPage><DCLIInvoiceLineDispute /></ProtectedPage>} />

                  <Route path="/vendors/ccm" element={<ProtectedPage><CCM /></ProtectedPage>} />
                  <Route path="/vendors/ccm/invoices/new" element={<ProtectedPage><CCMNewInvoice /></ProtectedPage>} />
                  <Route path="/vendors/ccm/invoice-line/:lineId" element={<ProtectedPage><CCMInvoiceLineDetails /></ProtectedPage>} />

                  <Route path="/vendors/scspa" element={<ProtectedPage><SCSPA /></ProtectedPage>} />
                  <Route path="/vendors/scspa/invoices/new" element={<ProtectedPage><SCSPANewInvoice /></ProtectedPage>} />

                  <Route path="/vendors/trac" element={<ProtectedPage><TRAC /></ProtectedPage>} />
                  <Route path="/vendors/trac/invoices/new" element={<ProtectedPage><TRACNewInvoice /></ProtectedPage>} />
                  <Route path="/vendors/trac/invoices/:invoiceId/review" element={<ProtectedPage><TRACInvoiceReview /></ProtectedPage>} />
                  <Route path="/vendors/trac/invoices/:invoiceId/validate" element={<ProtectedPage><TRACInvoiceValidate /></ProtectedPage>} />
                  <Route path="/vendors/trac/invoice-line/:lineId" element={<ProtectedPage><TRACInvoiceLineDetails /></ProtectedPage>} />
                  <Route path="/vendors/trac/invoice-line/:lineId/dispute" element={<ProtectedPage><TRACInvoiceLineDispute /></ProtectedPage>} />

                  <Route path="/vendors/flexivan" element={<ProtectedPage><FLEXIVAN /></ProtectedPage>} />
                  <Route path="/vendors/flexivan/invoices/new" element={<ProtectedPage><FLEXIVANNewInvoice /></ProtectedPage>} />

                  <Route path="/vendors/wccp" element={<ProtectedPage><WCCP /></ProtectedPage>} />
                  <Route path="/vendors/wccp/invoices/new" element={<ProtectedPage><WCCPNewInvoice /></ProtectedPage>} />
                  <Route path="/vendors/wccp/invoices/:invoiceId/review" element={<ProtectedPage><WCCPInvoiceReview /></ProtectedPage>} />
                  <Route path="/vendors/wccp/invoice-line/:lineId" element={<ProtectedPage><WCCPInvoiceLineDetails /></ProtectedPage>} />
                  <Route path="/vendors/wccp/invoice-line/:lineId/dispute" element={<ProtectedPage><WCCPInvoiceLineDispute /></ProtectedPage>} />

                  {/* Generic invoices */}
                  <Route path="/invoices" element={<ProtectedPage><InvoicesList /></ProtectedPage>} />
                  <Route path="/invoices/:invoiceId/details/:lineId" element={<ProtectedPage><InvoiceLineDetails /></ProtectedPage>} />
                  <Route path="/invoices/:invoiceId/dispute/:lineId" element={<ProtectedPage><InvoiceLineDispute /></ProtectedPage>} />

                  {/* Settings */}
                  <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />

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
