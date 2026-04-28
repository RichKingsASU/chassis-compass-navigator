import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedPage } from '@/components/auth/ProtectedPage';

// Generic invoice pages
const InvoicesList = lazy(() => import('@/pages/invoices/InvoicesList'));
const InvoiceLineDetails = lazy(() => import('@/pages/invoices/InvoiceLineDetails'));
const InvoiceLineDispute = lazy(() => import('@/pages/invoices/InvoiceLineDispute'));

// Loading Fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export default function InvoiceRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<ProtectedPage><InvoicesList /></ProtectedPage>} />
        <Route path=":invoiceId/details/:lineId" element={<ProtectedPage><InvoiceLineDetails /></ProtectedPage>} />
        <Route path=":invoiceId/dispute/:lineId" element={<ProtectedPage><InvoiceLineDispute /></ProtectedPage>} />
      </Routes>
    </Suspense>
  );
}
