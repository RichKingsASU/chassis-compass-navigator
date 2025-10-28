import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, HelpCircle, Flag } from "lucide-react";

// This type will depend on your line item data structure
type LineItem = {
  lineInvoiceNum: string;
  [key: string]: any; // Allow other properties
};

// Define the shape of our audit data
type AuditData = {
  validationChecks: {
    daysUsed: { status: "pass" | "fail" | "warn"; details: string };
    billedDay: { status: "pass" | "fail" | "warn"; details: string };
    carrierPaid: { status: "pass" | "fail" | "warn"; details: string };
    duplicateCharge: { status: "pass" | "fail" | "warn"; details: string };
    usageCoverage: { status: "pass" | "fail" | "warn"; details: string };
    customerContract: { status: "pass" | "fail" | "warn" | "inactive"; details: string };
  };
  infoSections: {
    dispute: any;
    credit: any;
    absorption: any;
    amPaidCarrier: any;
    amBilledCarrier: any;
  };
};

// A helper component for our validation checklist
const ValidationCheck = ({ title, status, details }: { title: string; status: string; details: string }) => {
  const getIcon = () => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warn":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "inactive":
        return <Flag className="h-5 w-5 text-gray-400" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-400" />;
    }
  };
  return (
    <div className="flex items-center space-x-3 mb-3">
      <div>{getIcon()}</div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{details}</p>
      </div>
    </div>
  );
};

// --- Mock Data ---
// In the real implementation, you'll fetch this based on the lineItem
const MOCK_AUDIT_DATA: AuditData = {
  validationChecks: {
    daysUsed: { status: "pass", details: "TMS Used Days (30) matches Invoice Gross Days (30)." },
    billedDay: { status: "pass", details: "Calculated Billed Days (25) matches TMS Rated-Quantity (25)." },
    carrierPaid: { status: "fail", details: "Carrier Paid Amount ($150) does not match Rate (5) * Qty (28) = $140." },
    duplicateCharge: { status: "pass", details: "No exact match found on previous invoices." },
    usageCoverage: { status: "warn", details: "2 days are not covered by LD/SO records." },
    customerContract: { status: "inactive", details: "This check is not activated." },
  },
  infoSections: {
    dispute: { "Dispute #": "D-456", "Status": "Pending", "Reason": "Overcharged", "Amount": "$10.00" },
    credit: { "Credit Provided by EP ($ Amount)": "$0.00" },
    absorption: { "Category": "None" },
    amPaidCarrier: { "Amount": "$150.00", "Rate": "$5.00", "Quantity": "28", "Reason": "Original quote" },
    amBilledCarrier: { "Vendor Credit/Invoice #": "VC-789", "Amount": "$0.00" },
  },
};
// --- End Mock Data ---

interface AuditModalProps {
  lineItem: LineItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AuditModal({ lineItem, isOpen, onOpenChange }: AuditModalProps) {
  if (!lineItem) return null;

  // TODO: Fetch real data based on lineItem.id
  const auditData = MOCK_AUDIT_DATA;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[70vh]">
        <DialogHeader>
          <DialogTitle>Line Item Audit: #{lineItem.lineInvoiceNum}</DialogTitle>
          <DialogDescription>
            Validating line item and related data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 overflow-y-auto">
          {/* === PART 1: VALIDATION CHECKS === */}
          <div className="md:col-span-1 border-r pr-6">
            <h4 className="text-lg font-semibold mb-4">Validation Checks</h4>
            <ValidationCheck title="Days Used Check" {...auditData.validationChecks.daysUsed} />
            <ValidationCheck title="Billed Day Check" {...auditData.validationChecks.billedDay} />
            <ValidationCheck title="Carrier Paid Check" {...auditData.validationChecks.carrierPaid} />
            <ValidationCheck title="Duplicate Charge Check" {...auditData.validationChecks.duplicateCharge} />
            <ValidationCheck title="Usage Coverage Check" {...auditData.validationChecks.usageCoverage} />
            <ValidationCheck title="Customer Contract Check" {...auditData.validationChecks.customerContract} />
          </div>

          {/* === PART 2: INFORMATIONAL FIELDS === */}
          <div className="md:col-span-2">
            <h4 className="text-lg font-semibold mb-4">Informational Fields</h4>
            <Tabs defaultValue="dispute">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dispute">Dispute</TabsTrigger>
                <TabsTrigger value="credit">Credit</TabsTrigger>
                <TabsTrigger value="absorption">Absorption</TabsTrigger>
                <TabsTrigger value="paidCarrier">Paid Carrier</TabsTrigger>
                <TabsTrigger value="billedCarrier">Billed Carrier</TabsTrigger>
              </TabsList>
              
              {/* Render content for each tab */}
              <TabsContent value="dispute">
                <InfoTab data={auditData.infoSections.dispute} />
              </TabsContent>
              <TabsContent value="credit">
                <InfoTab data={auditData.infoSections.credit} />
              </TabsContent>
              <TabsContent value="absorption">
                <InfoTab data={auditData.infoSections.absorption} />
              </TabsContent>
              <TabsContent value="paidCarrier">
                <InfoTab data={auditData.infoSections.amPaidCarrier} />
              </TabsContent>
              <TabsContent value="billedCarrier">
                <InfoTab data={auditData.infoSections.amBilledCarrier} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// A simple component to render the data in each tab
const InfoTab = ({ data }: { data: any }) => {
  return (
    <div className="p-4 border rounded-md bg-muted/50">
      <ul className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <li key={key} className="flex justify-between">
            <span className="text-muted-foreground">{key}:</span>
            <span className="font-medium">{String(value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
