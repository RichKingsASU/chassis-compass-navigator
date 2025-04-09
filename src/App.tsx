
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ChassisManagement from "./pages/ChassisManagement";
import ChassisValidation from "./pages/ChassisValidation";
import DocumentUpload from "./pages/DocumentUpload";
import NotFound from "./pages/NotFound";

// GPS Provider Pages
import Samsara from "./pages/gps/Samsara";
import BlackBerry from "./pages/gps/BlackBerry";
import Fleetview from "./pages/gps/Fleetview";
import Fleetlocate from "./pages/gps/Fleetlocate";
import Anytrek from "./pages/gps/Anytrek";

// Vendor Pages
import DCLI from "./pages/vendors/DCLI";
import CCM from "./pages/vendors/CCM";
import SCSPA from "./pages/vendors/SCSPA";
import WCCP from "./pages/vendors/WCCP";
import TRAC from "./pages/vendors/TRAC";
import FLEXIVAN from "./pages/vendors/FLEXIVAN";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/validation" element={
            <DashboardLayout>
              <ChassisValidation />
            </DashboardLayout>
          } />
          <Route path="/documents" element={
            <DashboardLayout>
              <DocumentUpload />
            </DashboardLayout>
          } />
          
          {/* GPS Provider Routes */}
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
          <Route path="/vendors/dcli" element={
            <DashboardLayout>
              <DCLI />
            </DashboardLayout>
          } />
          <Route path="/vendors/ccm" element={
            <DashboardLayout>
              <CCM />
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
          <Route path="/vendors/trac" element={
            <DashboardLayout>
              <TRAC />
            </DashboardLayout>
          } />
          <Route path="/vendors/flexivan" element={
            <DashboardLayout>
              <FLEXIVAN />
            </DashboardLayout>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
