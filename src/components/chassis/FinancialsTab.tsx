import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FinancialsTab = ({ chassisId }: { chassisId: string }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    toast({
      title: "Upload Started",
      description: "Processing your financial data file...",
    });

    // Placeholder for file upload logic
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Upload Complete",
        description: "Financial data has been processed successfully.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Financial data tables are not yet configured. Upload functionality coming soon.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Financial Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload Financial Data</h3>
            <p className="text-muted-foreground mb-4">
              Upload Excel files containing TMS financials, equipment costs, or repair records
            </p>
            <label htmlFor="financial-upload">
              <Button disabled={isLoading} asChild>
                <span>
                  {isLoading ? "Processing..." : "Select File"}
                </span>
              </Button>
            </label>
            <input
              id="financial-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          
          <div className="mt-6 text-sm text-muted-foreground">
            <p className="font-semibold mb-2">Supported file types:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>TMS Load Financials (revenue, fuel surcharge, accessorials)</li>
              <li>Equipment Costs (leasing, maintenance costs)</li>
              <li>Repair Records (repair costs and timestamps)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialsTab;
