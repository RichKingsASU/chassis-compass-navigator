import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import DashboardLayout from "./components/layout/DashboardLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ChassisManagement from "./pages/ChassisManagement";
import ChassisValidation from "./pages/ChassisValidation";
import TMSData from "./pages/TMSData";
import GpsOverview from "./pages/GpsOverview";
import Settings from "./pages/Settings";
import AdvancedFeatures from "./pages/AdvancedFeatures";
import VendorUpload from "./pages/VendorUpload";
import GpsProviderUpload from "./pages/GpsProviderUpload";
import NotFound from "./pages/NotFound";
import Anytrek from "./pages/gps/Anytrek";
import Samsara from "./pages/gps/Samsara";
import BlackBerry from "./pages/gps/BlackBerry";
import Fleetlocate from "./pages/gps/Fleetlocate";
import Fleetview from "./pages/gps/Fleetview";
import MercuryGate from "./pages/tms/MercuryGate";
import PortPro from "./pages/tms/PortPro";
import JEDYard from "./pages/yards/JEDYard";
import POLAYard from "./pages/yards/POLAYard";
import CCM from "./pages/vendors/CCM";
import DCLI from "./pages/vendors/DCLI";
import FLEXIVAN from "./pages/vendors/FLEXIVAN";
import TRAC from "./pages/vendors/TRAC";
import TRACNewInvoice from "./pages/trac/NewInvoice";
import TRACInvoiceReview from "./pages/trac/InvoiceReview";
import TRACInvoiceValidate from "./pages/trac/InvoiceValidate";
import TRACInvoiceLineDetails from "./pages/trac/InvoiceLineDetails";
import TRACInvoiceLineDispute from "./pages/trac/InvoiceLineDispute";
import WCCP from "./pages/vendors/WCCP";
import SCSPA from "./pages/vendors/SCSPA";
import VendorValidation from "./pages/VendorValidation";
import NewInvoice from "./pages/dcli/NewInvoice";
import InvoiceReview from "./pages/dcli/InvoiceReview";
import DCLIInvoiceLineDetails from "./pages/dcli/InvoiceLineDetails";
import DCLIInvoiceLineDispute from "./pages/dcli/InvoiceLineDispute";
import WCCPNewInvoice from "./pages/wccp/NewInvoice";
import WCCPInvoiceReview from "./pages/wccp/InvoiceReview";
import WCCPInvoiceLineDetails from "./pages/wccp/InvoiceLineDetails";
import WCCPInvoiceLineDispute from "./pages/wccp/InvoiceLineDispute";
import InvoicesList from "./pages/invoices/InvoicesList";
import InvoiceLineDetails from "./pages/invoices/InvoiceLineDetails";
import InvoiceLineDispute from "./pages/invoices/InvoiceLineDispute";
import CCMInvoiceLineDetails from "./pages/ccm/InvoiceLineDetails";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <div className="min-h-screen">
              <Toaster />
              <Sonner />
            <Routes>
              <Route path="/" element={
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              } />
              <Route path="/chassis" element={
                <DashboardLayout>
                  <ChassisManagement />
                </DashboardLayout>
              } />
              <Route path="/tms" element={
                <DashboardLayout>
                  <TMSData />
                </DashboardLayout>
              } />
              <Route path="/tms/mercury-gate" element={
                <DashboardLayout>
                  <MercuryGate />
                </DashboardLayout>
              } />
              <Route path="/tms/port-pro" element={
                <DashboardLayout>
                  <PortPro />
                </DashboardLayout>
              } />
              
              {/* Yard Report Routes */}
              <Route path="/yards/pola" element={
                <DashboardLayout>
                  <POLAYard />
                </DashboardLayout>
              } />
              <Route path="/yards/jed" element={
                <DashboardLayout>
                  <JEDYard />
                </DashboardLayout>
              } />
              
              <Route path="/validation" element={
                <DashboardLayout>
                  <ChassisValidation />
                </DashboardLayout>
              } />
              <Route path="/advanced-features" element={
                <DashboardLayout>
                  <AdvancedFeatures />
                </DashboardLayout>
              } />
              
              {/* GPS Provider Routes */}
              <Route path="/gps" element={
                <DashboardLayout>
                  <GpsOverview />
                </DashboardLayout>
              } />
              <Route path="/gps/samsara" element={
                <DashboardLayout>
                  <Samsara />
                </DashboardLayout>
              } />
              <Route path="/gps/blackberry" element={
                <DashboardLayout>
                  <BlackBerry />
                </DashboardLayout>
              } />
              <Route path="/gps/fleetview" element={
                <DashboardLayout>
                  <Fleetview />
                </DashboardLayout>
              } />
              <Route path="/gps/fleetlocate" element={
                <DashboardLayout>
                  <Fleetlocate />
                </DashboardLayout>
              } />
              <Route path="/gps/anytrek" element={
                <DashboardLayout>
                  <Anytrek />
                </DashboardLayout>
              } />
              
              {/* Vendor Routes */}
              <Route path="/vendor-validation" element={
                <DashboardLayout>
                  <VendorValidation />
                </DashboardLayout>
              } />
              <Route path="/vendors/dcli" element={
                <DashboardLayout>
                  <DCLI />
                </DashboardLayout>
              } />
              <Route path="/vendors/dcli/invoices/new" element={
                <DashboardLayout>
                  <NewInvoice />
                </DashboardLayout>
              } />
              <Route path="/vendors/dcli/invoices/:invoiceId/review" element={
                <DashboardLayout>
                  <InvoiceReview />
                </DashboardLayout>
              } />
              <Route path="/vendors/dcli/invoice-line/:lineId" element={
                <DashboardLayout>
                  <DCLIInvoiceLineDetails />
                </DashboardLayout>
              } />
              <Route path="/vendors/dcli/invoice-line/:lineId/dispute" element={
                <DashboardLayout>
                  <DCLIInvoiceLineDispute />
                </DashboardLayout>
              } />
              <Route path="/vendors/ccm" element={
                <DashboardLayout>
                  <CCM />
                </DashboardLayout>
              } />
              <Route path="/vendors/ccm/invoice-line/:lineId" element={
                <DashboardLayout>
                  <CCMInvoiceLineDetails />
                </DashboardLayout>
              } />
              <Route path="/vendors/scspa" element={
                <DashboardLayout>
                  <SCSPA />
                </DashboardLayout>
              } />
              <Route path="/vendors/wccp" element={
                <DashboardLayout>
                  <WCCP />
                </DashboardLayout>
              } />
              <Route path="/vendors/wccp/invoices/new" element={
                <DashboardLayout>
                  <WCCPNewInvoice />
                </DashboardLayout>
              } />
              <Route path="/vendors/wccp/invoices/:invoiceId/review" element={
                <DashboardLayout>
                  <WCCPInvoiceReview />
                </DashboardLayout>
              } />
              <Route path="/vendors/wccp/invoice-line/:lineId" element={
                <DashboardLayout>
                  <WCCPInvoiceLineDetails />
                </DashboardLayout>
              } />
              <Route path="/vendors/wccp/invoice-line/:lineId/dispute" element={
                <DashboardLayout>
                  <WCCPInvoiceLineDispute />
                </DashboardLayout>
              } />
              <Route path="/vendors/trac" element={
                <DashboardLayout>
                  <TRAC />
                </DashboardLayout>
              } />
              <Route path="/vendors/trac/invoices/new" element={
                <DashboardLayout>
                  <TRACNewInvoice />
                </DashboardLayout>
              } />
              <Route path="/vendors/trac/invoices/:invoiceId/review" element={
                <DashboardLayout>
                  <TRACInvoiceReview />
                </DashboardLayout>
              } />
              <Route path="/vendors/trac/invoices/:invoiceId/validate" element={
                <DashboardLayout>
                  <TRACInvoiceValidate />
                </DashboardLayout>
              } />
              <Route path="/vendors/trac/invoice-line/:lineId" element={
                <DashboardLayout>
                  <TRACInvoiceLineDetails />
                </DashboardLayout>
              } />
              <Route path="/vendors/trac/invoice-line/:lineId/dispute" element={
                <DashboardLayout>
                  <TRACInvoiceLineDispute />
                </DashboardLayout>
              } />
              <Route path="/vendors/flexivan" element={
                <DashboardLayout>
                  <FLEXIVAN />
                </DashboardLayout>
              } />
              
              {/* Settings Route */}
              <Route path="/settings" element={
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              } />
              
              {/* Invoice Validation Routes */}
              <Route path="/invoices" element={
                <DashboardLayout>
                  <InvoicesList />
                </DashboardLayout>
              } />
              <Route path="/invoices/:invoiceId/details/:lineId" element={
                <DashboardLayout>
                  <InvoiceLineDetails />
                </DashboardLayout>
              } />
              <Route path="/invoices/:invoiceId/dispute/:lineId" element={
                <DashboardLayout>
                  <InvoiceLineDispute />
                </DashboardLayout>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
