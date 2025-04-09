
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, Phone, Mail, ExternalLink, ArrowUpRight, AlertTriangle } from "lucide-react";
import KPICard from './KPICard';
import CCMInvoiceManager from './CCMInvoiceManager';

const CCMDashboard = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6 pt-4">
          {/* KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard 
              title="Total Spend" 
              value="$1,245,632" 
              change={+5.2}
              description="Year to date" 
              icon="dollar" 
            />
            <KPICard 
              title="Active Vendors" 
              value="6" 
              description="Currently active" 
              icon="users" 
            />
            <KPICard 
              title="Pending Invoices" 
              value="24" 
              change={-3}
              description="Awaiting review" 
              icon="file" 
            />
            <KPICard 
              title="Disputed Charges" 
              value="$42,587" 
              change={+12}
              description="Currently in dispute" 
              icon="alert" 
            />
          </div>
          
          {/* Important Notices */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                  Important Notices
                </CardTitle>
                <Badge>3 New</Badge>
              </div>
              <CardDescription>Critical updates and announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                  <div className="font-medium">Rate Change Notice</div>
                  <div className="text-sm text-muted-foreground">Effective June 1, 2025: CCM chassis rates will increase by 3.5% nationwide</div>
                </div>
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <div className="font-medium">System Maintenance</div>
                  <div className="text-sm text-muted-foreground">Portal will be down for maintenance on April 15, 2025 from 2AM-4AM EST</div>
                </div>
                <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                  <div className="font-medium">New Portal Feature</div>
                  <div className="text-sm text-muted-foreground">Batch upload functionality now available for invoice processing</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Account Contact Information</CardTitle>
                <CardDescription>Your CCM account representatives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Customer Support</h4>
                    <p className="text-sm text-muted-foreground">(800) 555-1234</p>
                    <p className="text-xs text-muted-foreground mt-1">Available M-F, 8AM-8PM EST</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Account Representative</h4>
                    <p className="text-sm text-muted-foreground">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">sarah.johnson@ccm.com</p>
                    <p className="text-xs text-muted-foreground mt-1">Response within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Escalation Contact</h4>
                    <p className="text-sm text-muted-foreground">Robert Chen, Regional Manager</p>
                    <p className="text-sm text-muted-foreground">robert.chen@ccm.com</p>
                    <p className="text-xs text-muted-foreground mt-1">(800) 555-5678 ext. 342</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Miscellaneous Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Quick Resources</CardTitle>
                <CardDescription>Helpful links and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded flex items-center justify-center">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">CCM Customer Portal</h4>
                        <p className="text-xs text-muted-foreground">Access your full CCM account</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-green-100 text-green-700 rounded flex items-center justify-center">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Service Bulletins</h4>
                        <p className="text-xs text-muted-foreground">Latest operational updates</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-purple-100 text-purple-700 rounded flex items-center justify-center">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Chassis Location Guide</h4>
                        <p className="text-xs text-muted-foreground">Find nearest drop-off locations</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-red-100 text-red-700 rounded flex items-center justify-center">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Dispute Resolution Guide</h4>
                        <p className="text-xs text-muted-foreground">How to dispute incorrect charges</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Transactions/Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
              <CardDescription>Latest invoice activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Apr 05, 2025</TableCell>
                    <TableCell>CCM-29384</TableCell>
                    <TableCell>$4,320.00</TableCell>
                    <TableCell>
                      <Badge className="bg-amber-500">Pending</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Apr 02, 2025</TableCell>
                    <TableCell>CCM-29375</TableCell>
                    <TableCell>$2,150.00</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Approved</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mar 28, 2025</TableCell>
                    <TableCell>CCM-29312</TableCell>
                    <TableCell>$3,785.00</TableCell>
                    <TableCell>
                      <Badge className="bg-red-500">Disputed</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mar 15, 2025</TableCell>
                    <TableCell>CCM-29298</TableCell>
                    <TableCell>$1,920.00</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Approved</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices" className="pt-4">
          <CCMInvoiceManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CCMDashboard;
