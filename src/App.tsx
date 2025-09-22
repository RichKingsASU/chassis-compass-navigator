
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ChassisManagement from "./pages/ChassisManagement";
import ChassisValidation from "./pages/ChassisValidation";
import AdvancedFeatures from "./pages/AdvancedFeatures";
import TMSData from "./pages/TMSData";
import MercuryGate from "./pages/tms/MercuryGate";
import PortPro from "./pages/tms/PortPro";
import NotFound from "./pages/NotFound";

// Yard Report Pages
import POLAYard from "./pages/yards/POLAYard";
import JEDYard from "./pages/yards/JEDYard";

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
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
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
              
              {/* Settings Route */}
              <Route path="/settings" element={
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
