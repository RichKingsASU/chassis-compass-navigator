
import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormLabel } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ChassisValidation = () => {
  const [selectedVendor, setSelectedVendor] = useState("");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Mock data for vendors
  const vendors = [
    { id: "dcli", name: "DCLI" },
    { id: "ccm", name: "CCM" },
    { id: "scspa", name: "SCSPA" },
    { id: "wccp", name: "WCCP" },
    { id: "trac", name: "TRAC" },
    { id: "flexivan", name: "FLEXIVAN" },
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

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h1 className="dash-title">Chassis Validation</h1>
      </div>
      
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
