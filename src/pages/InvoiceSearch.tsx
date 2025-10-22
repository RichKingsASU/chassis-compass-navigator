import DashboardLayout from "@/components/layout/DashboardLayout";
import { VendorChatSearch } from "@/components/invoices/VendorChatSearch";

export default function InvoiceSearch() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invoice Search</h1>
          <p className="text-muted-foreground mt-2">
            Search across all vendor invoices using natural language
          </p>
        </div>
        <VendorChatSearch />
      </div>
    </DashboardLayout>
  );
}
