import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedPage } from '@/components/auth/ProtectedPage';

// Vendors
const VendorDashboard = lazy(() => import('@/pages/vendors/VendorDashboard'));
const DCLI = lazy(() => import('@/pages/vendors/DCLI'));
const CCM = lazy(() => import('@/pages/vendors/CCM'));
const TRAC = lazy(() => import('@/pages/vendors/TRAC'));
const FLEXIVAN = lazy(() => import('@/pages/vendors/FLEXIVAN'));
const WCCP = lazy(() => import('@/pages/vendors/WCCP'));
const SCSPA = lazy(() => import('@/pages/vendors/SCSPA'));
const VendorComingSoon = lazy(() => import('@/pages/vendors/VendorComingSoon'));

// DCLI invoice pages
const DCLINewInvoice = lazy(() => import('@/pages/dcli/NewInvoice'));
const DCLIInvoiceReview = lazy(() => import('@/pages/dcli/InvoiceReview'));
const DCLIInvoiceDetail = lazy(() => import('@/pages/dcli/InvoiceDetail'));
const DCLIInvoiceLineDetail = lazy(() => import('@/pages/dcli/InvoiceLineDetail'));
const DCLIInvoiceLineDispute = lazy(() => import('@/pages/dcli/InvoiceLineDispute'));
const DCLIActivity = lazy(() => import('@/pages/dcli/Activity'));
const DCLIFinancials = lazy(() => import('@/pages/dcli/Financials'));
const DCLIDocuments = lazy(() => import('@/pages/dcli/Documents'));

// CCM invoice pages
const CCMNewInvoice = lazy(() => import('@/pages/ccm/NewInvoice'));
const CCMInvoiceLineDetails = lazy(() => import('@/pages/ccm/InvoiceLineDetails'));

// TRAC invoice pages
const TRACNewInvoice = lazy(() => import('@/pages/trac/NewInvoice'));
const TRACInvoiceReview = lazy(() => import('@/pages/trac/InvoiceReview'));
const TRACInvoiceValidate = lazy(() => import('@/pages/trac/InvoiceValidate'));
const TRACInvoiceLineDetails = lazy(() => import('@/pages/trac/InvoiceLineDetails'));
const TRACInvoiceLineDispute = lazy(() => import('@/pages/trac/InvoiceLineDispute'));

// WCCP invoice pages
const WCCPNewInvoice = lazy(() => import('@/pages/wccp/NewInvoice'));
const WCCPInvoiceReview = lazy(() => import('@/pages/wccp/InvoiceReview'));
const WCCPInvoiceLineDetails = lazy(() => import('@/pages/wccp/InvoiceLineDetails'));
const WCCPInvoiceLineDispute = lazy(() => import('@/pages/wccp/InvoiceLineDispute'));

// FLEXIVAN/SCSPA invoice pages
const FLEXIVANNewInvoice = lazy(() => import('@/pages/flexivan/NewInvoice'));
const SCSPANewInvoice = lazy(() => import('@/pages/scspa/NewInvoice'));

// Loading Fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export default function VendorRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route index element={<ProtectedPage><VendorDashboard /></ProtectedPage>} />
        <Route path="dcli" element={<ProtectedPage><DCLI /></ProtectedPage>} />
        <Route path="dcli/invoices" element={<Navigate to="/vendors/dcli?tab=invoices" replace />} />
        <Route path="dcli/invoices/new" element={<ProtectedPage><DCLINewInvoice /></ProtectedPage>} />
        <Route path="dcli/invoices/tracker" element={<Navigate to="/vendors/dcli?tab=invoices" replace />} />
        <Route path="dcli/invoices/:invoiceId/review" element={<ProtectedPage><DCLIInvoiceReview /></ProtectedPage>} />
        <Route path="dcli/invoices/:invoiceId/detail" element={<ProtectedPage><DCLIInvoiceDetail /></ProtectedPage>} />
        <Route path="dcli/invoices/:invoiceId/lines/:lineId" element={<ProtectedPage><DCLIInvoiceLineDetail /></ProtectedPage>} />
        <Route path="dcli/invoice-line/:lineId/dispute" element={<ProtectedPage><DCLIInvoiceLineDispute /></ProtectedPage>} />
        <Route path="dcli/activity" element={<ProtectedPage><DCLIActivity /></ProtectedPage>} />
        <Route path="dcli/financials" element={<ProtectedPage><DCLIFinancials /></ProtectedPage>} />
        <Route path="dcli/documents" element={<ProtectedPage><DCLIDocuments /></ProtectedPage>} />

        <Route path="ccm" element={<ProtectedPage><CCM /></ProtectedPage>} />
        <Route path="ccm/invoices/new" element={<ProtectedPage><CCMNewInvoice /></ProtectedPage>} />
        <Route path="ccm/invoices" element={<Navigate to="/vendors/ccm?tab=invoices" replace />} />
        <Route path="ccm/activity" element={<Navigate to="/vendors/ccm?tab=activity" replace />} />
        <Route path="ccm/financials" element={<Navigate to="/vendors/ccm?tab=financials" replace />} />
        <Route path="ccm/documents" element={<Navigate to="/vendors/ccm?tab=documents" replace />} />
        <Route path="ccm/invoice-line/:lineId" element={<ProtectedPage><CCMInvoiceLineDetails /></ProtectedPage>} />

        <Route path="scspa" element={<ProtectedPage><SCSPA /></ProtectedPage>} />
        <Route path="scspa/invoices/new" element={<ProtectedPage><SCSPANewInvoice /></ProtectedPage>} />
        <Route path="scspa/invoices" element={<Navigate to="/vendors/scspa?tab=invoices" replace />} />
        <Route path="scspa/activity" element={<Navigate to="/vendors/scspa?tab=activity" replace />} />
        <Route path="scspa/financials" element={<Navigate to="/vendors/scspa?tab=financials" replace />} />
        <Route path="scspa/documents" element={<Navigate to="/vendors/scspa?tab=documents" replace />} />

        <Route path="trac" element={<ProtectedPage><TRAC /></ProtectedPage>} />
        <Route path="trac/invoices/new" element={<ProtectedPage><TRACNewInvoice /></ProtectedPage>} />
        <Route path="trac/invoices" element={<Navigate to="/vendors/trac?tab=invoices" replace />} />
        <Route path="trac/activity" element={<Navigate to="/vendors/trac?tab=activity" replace />} />
        <Route path="trac/financials" element={<Navigate to="/vendors/trac?tab=financials" replace />} />
        <Route path="trac/documents" element={<Navigate to="/vendors/trac?tab=documents" replace />} />
        <Route path="trac/invoices/:invoiceId/review" element={<ProtectedPage><TRACInvoiceReview /></ProtectedPage>} />
        <Route path="trac/invoices/:invoiceId/validate" element={<ProtectedPage><TRACInvoiceValidate /></ProtectedPage>} />
        <Route path="trac/invoice-line/:lineId" element={<ProtectedPage><TRACInvoiceLineDetails /></ProtectedPage>} />
        <Route path="trac/invoice-line/:lineId/dispute" element={<ProtectedPage><TRACInvoiceLineDispute /></ProtectedPage>} />

        <Route path="flexivan" element={<ProtectedPage><FLEXIVAN /></ProtectedPage>} />
        <Route path="flexivan/invoices/new" element={<ProtectedPage><FLEXIVANNewInvoice /></ProtectedPage>} />
        <Route path="flexivan/invoices" element={<Navigate to="/vendors/flexivan?tab=invoices" replace />} />
        <Route path="flexivan/activity" element={<Navigate to="/vendors/flexivan?tab=activity" replace />} />
        <Route path="flexivan/financials" element={<Navigate to="/vendors/flexivan?tab=financials" replace />} />
        <Route path="flexivan/documents" element={<Navigate to="/vendors/flexivan?tab=documents" replace />} />

        <Route path="wccp" element={<ProtectedPage><WCCP /></ProtectedPage>} />
        <Route path="wccp/invoices/new" element={<ProtectedPage><WCCPNewInvoice /></ProtectedPage>} />
        <Route path="wccp/invoices" element={<Navigate to="/vendors/wccp?tab=invoices" replace />} />
        <Route path="wccp/activity" element={<Navigate to="/vendors/wccp?tab=activity" replace />} />
        <Route path="wccp/financials" element={<Navigate to="/vendors/wccp?tab=financials" replace />} />
        <Route path="wccp/documents" element={<Navigate to="/vendors/wccp?tab=documents" replace />} />
        <Route path="wccp/invoices/:invoiceId/review" element={<ProtectedPage><WCCPInvoiceReview /></ProtectedPage>} />
        <Route path="wccp/invoice-line/:lineId" element={<ProtectedPage><WCCPInvoiceLineDetails /></ProtectedPage>} />
        <Route path="wccp/invoice-line/:lineId/dispute" element={<ProtectedPage><WCCPInvoiceLineDispute /></ProtectedPage>} />
      </Routes>
    </Suspense>
  );
}
