
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Upload, 
  Check, 
  X, 
  MessageSquare,
  Calendar,
  Clock,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormLabel } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ValidationKPIs from "@/components/validation/ValidationKPIs";
import VendorBreakdown from "@/components/validation/VendorBreakdown";
import ValidationChart from "@/components/validation/ValidationChart";
import ValidationAlerts from "@/components/validation/ValidationAlerts";

const ChassisValidation = () => {
  const [selectedVendor, setSelectedVendor] = useState("");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("analytics");
  
  // Mock data for vendors
  const vendors = [
    { id: "dcli", name: "DCLI" },
    { id: "ccm", name: "CCM" },
    { id: "scspa", name: "SCSPA" },
    { id: "wccp", name: "WCCP" },
    { id: "trac", name: "TRAC" },
    { id: "flexivan", name: "FLEXIVAN" },
  ];
  
  // Mock analytics data
  const kpiData = {
    totalValidations: 47,
    pendingValidations: 12,
    acceptedValidations: 28,
    disputedValidations: 7,
    documentsUploaded: 35,
    totalUsageDays: 1247,
    avgResolutionTime: 3.2,
    disputeRate: 14.9
  };

  const vendorData = [
    {
      name: "DCLI",
      id: "dcli",
      totalValidations: 15,
      pendingValidations: 3,
      acceptedValidations: 10,
      disputedValidations: 2,
      acceptanceRate: 66.7,
      disputeRate: 13.3,
      avgUsageDays: 18,
      trend: 'up' as const
    },
    {
      name: "TRAC",
      id: "trac",
      totalValidations: 12,
      pendingValidations: 5,
      acceptedValidations: 6,
      disputedValidations: 1,
      acceptanceRate: 50.0,
      disputeRate: 8.3,
      avgUsageDays: 25,
      trend: 'stable' as const
    },
    {
      name: "CCM",
      id: "ccm",
      totalValidations: 8,
      pendingValidations: 2,
      acceptedValidations: 5,
      disputedValidations: 1,
      acceptanceRate: 62.5,
      disputeRate: 12.5,
      avgUsageDays: 22,
      trend: 'down' as const
    },
    {
      name: "FLEXIVAN",
      id: "flexivan",
      totalValidations: 6,
      pendingValidations: 1,
      acceptedValidations: 4,
      disputedValidations: 1,
      acceptanceRate: 66.7,
      disputeRate: 16.7,
      avgUsageDays: 20,
      trend: 'up' as const
    },
    {
      name: "SCSPA",
      id: "scspa",
      totalValidations: 3,
      pendingValidations: 1,
      acceptedValidations: 2,
      disputedValidations: 0,
      acceptanceRate: 66.7,
      disputeRate: 0,
      avgUsageDays: 15,
      trend: 'stable' as const
    },
    {
      name: "WCCP",
      id: "wccp",
      totalValidations: 3,
      pendingValidations: 0,
      acceptedValidations: 1,
      disputedValidations: 2,
      acceptanceRate: 33.3,
      disputeRate: 66.7,
      avgUsageDays: 28,
      trend: 'down' as const
    }
  ];

  const chartData = {
    vendorData: vendorData.map(v => ({
      vendor: v.name,
      accepted: v.acceptedValidations,
      pending: v.pendingValidations,
      disputed: v.disputedValidations,
      total: v.totalValidations
    })),
    timeSeriesData: [
      { month: 'Jan', validations: 35, disputes: 8, acceptanceRate: 77 },
      { month: 'Feb', validations: 42, disputes: 6, acceptanceRate: 86 },
      { month: 'Mar', validations: 38, disputes: 9, acceptanceRate: 76 },
      { month: 'Apr', validations: 47, disputes: 7, acceptanceRate: 85 },
    ],
    statusDistribution: [
      { name: 'Accepted', value: 28, color: 'hsl(142 76% 36%)' },
      { name: 'Pending', value: 12, color: 'hsl(45 93% 47%)' },
      { name: 'Disputed', value: 7, color: 'hsl(0 84% 60%)' }
    ]
  };

  const alerts = [
    {
      id: '1',
      type: 'warning' as const,
      title: 'High Dispute Rate Alert',
      description: 'WCCP has a dispute rate of 66.7%, significantly above the 15% threshold.',
      vendor: 'WCCP',
      count: 2,
      action: {
        label: 'Review Details',
        onClick: () => handleViewVendor('wccp')
      }
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Pending Validations',
      description: 'TRAC has 5 validations pending review for over 48 hours.',
      vendor: 'TRAC',
      count: 5,
      action: {
        label: 'Review Now',
        onClick: () => handleViewVendor('trac')
      }
    },
    {
      id: '3',
      type: 'warning' as const,
      title: 'Missing Documentation',
      description: '12 chassis validations are missing supporting documentation.',
      count: 12,
      action: {
        label: 'View All',
        onClick: () => setActiveTab('validation')
      }
    }
  ];

  // Mock data for validation items
  const validationItems = {
    dcli: [
      { 
        id: 1, 
        chassisId: "CMAU1234567", 
        dateRange: "Apr 1-15, 2025", 
        usageDays: 15, 
        disputeStatus: "pending",
        hasDocument: false,
        notes: ""
      },
      { 
        id: 2, 
        chassisId: "FSCU5555123", 
        dateRange: "Apr 1-10, 2025", 
        usageDays: 10, 
        disputeStatus: "accepted",
        hasDocument: true,
        notes: "Confirmed with GPS data"
      },
      { 
        id: 3, 
        chassisId: "NYKU9876543", 
        dateRange: "Apr 5-20, 2025", 
        usageDays: 16, 
        disputeStatus: "disputed",
        hasDocument: true,
        notes: "Only used for 12 days according to our records"
      },
    ],
    trac: [
      { 
        id: 4, 
        chassisId: "TCLU7654321", 
        dateRange: "Apr 1-30, 2025", 
        usageDays: 30, 
        disputeStatus: "pending",
        hasDocument: false,
        notes: ""
      },
      { 
        id: 5, 
        chassisId: "APHU1122334", 
        dateRange: "Apr 1-30, 2025", 
        usageDays: 30, 
        disputeStatus: "pending",
        hasDocument: false,
        notes: ""
      },
    ],
    ccm: [
      { 
        id: 6, 
        chassisId: "MSCU5544332", 
        dateRange: "Apr 1-15, 2025", 
        usageDays: 15, 
        disputeStatus: "pending",
        hasDocument: false,
        notes: ""
      },
    ],
    flexivan: [
      { 
        id: 7, 
        chassisId: "OOLU8899776", 
        dateRange: "Apr 1-20, 2025", 
        usageDays: 20, 
        disputeStatus: "accepted",
        hasDocument: true,
        notes: "Validated with GPS data"
      },
    ],
    scspa: [],
    wccp: [],
  };

  const getDisputeStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Accepted</Badge>;
      case 'disputed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Disputed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleAddNote = (item: any) => {
    setSelectedItem(item);
    setNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    // Save note logic would go here
    setNoteDialogOpen(false);
  };

  const handleToggleDispute = (item: any, newStatus: string) => {
    // Update dispute status logic would go here
    console.log("Toggling dispute for", item.chassisId, "to", newStatus);
  };

  const handleViewVendor = (vendorId: string) => {
    setSelectedVendor(vendorId);
    setActiveTab('validation');
  };

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h1 className="dash-title">Vendor Validation Analytics</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Individual Validation
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="space-y-6 pt-4">
          {/* KPI Overview */}
          <ValidationKPIs data={kpiData} />
          
          {/* Alerts Section */}
          <ValidationAlerts alerts={alerts} />
          
          {/* Charts */}
          <ValidationChart data={chartData} />
          
          {/* Vendor Breakdown */}
          <VendorBreakdown vendors={vendorData} onViewVendor={handleViewVendor} />
        </TabsContent>
        
        <TabsContent value="validation" className="pt-4">
          <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Validation Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <FormLabel className="mb-2 block">Select Vendor</FormLabel>
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Choose a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedVendor && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis ID</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Usage Days</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationItems[selectedVendor as keyof typeof validationItems].length > 0 ? (
                    validationItems[selectedVendor as keyof typeof validationItems].map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.chassisId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-muted-foreground" />
                            {item.dateRange}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-muted-foreground" />
                            {item.usageDays} days
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.hasDocument ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                              Uploaded
                            </Badge>
                          ) : (
                            <Button variant="outline" size="sm" className="gap-1">
                              <Upload size={14} />
                              Upload
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>{getDisputeStatusBadge(item.disputeStatus)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.disputeStatus === "pending" && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                  onClick={() => handleToggleDispute(item, "accepted")}
                                >
                                  <Check size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  onClick={() => handleToggleDispute(item, "disputed")}
                                >
                                  <X size={16} />
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => handleAddNote(item)}
                            >
                              <MessageSquare size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No pending validations for this vendor.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!selectedVendor && (
            <div className="text-center py-12 text-muted-foreground">
              Select a vendor to see pending validations.
            </div>
          )}
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note for Chassis ID: {selectedItem?.chassisId}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Enter your note here..." 
              className="min-h-[120px]"
              defaultValue={selectedItem?.notes || ""}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChassisValidation;
