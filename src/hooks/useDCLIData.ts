import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardMetrics {
  totalOutstanding: number;
  totalRecords: number;
  overdueAmount: number;
  overdueCount: number;
  pendingAmount: number;
  pendingCount: number;
  monthlyPaid: number;
  monthlyPaidCount: number;
  statusBreakdown: Array<{ status: string; count: number }>;
}

export const useDCLIData = () => {
  const [activityData, setActivityData] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    totalOutstanding: 0,
    totalRecords: 0,
    overdueAmount: 0,
    overdueCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
    monthlyPaid: 0,
    monthlyPaidCount: 0,
    statusBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDCLIData();
  }, []);

  const fetchDCLIData = async () => {
    try {
      setLoading(true);
      
      // Fetch only validated/saved invoices from dcli_invoice_staging
      const { data, error } = await supabase
        .from('dcli_invoice_staging')
        .select('*')
        .neq('status', 'pending_validation') // Exclude pending validation
        .not('validation_status', 'is', null) // Must have validation status
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setActivityData(data);
        // Transform staging data into invoice-like records
        const transformedInvoiceData = transformStagingToInvoices(data);
        setInvoiceData(transformedInvoiceData);
        calculateDashboardMetrics(transformedInvoiceData);
      }
    } catch (error) {
      console.error('Error fetching DCLI data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to fetch DCLI invoice data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Transform dcli_invoice_staging data into invoice-like records
  const transformStagingToInvoices = (stagingData: any[]) => {
    return stagingData.map((staging) => {
      const invoiceId = staging.summary_invoice_id || staging.id;
      const amount = parseFloat(staging.amount_due) || 0;
      
      // Determine status based on validation_status
      let status = 'Open';
      if (staging.status === 'approved') {
        status = 'Closed';
      } else if (staging.status === 'disputed') {
        status = 'Open';
      }
      
      const invoiceRecord = {
        invoice_id: invoiceId,
        description: `${staging.pool || 'Pool'} - ${staging.account_code || 'Account'}`,
        status: status,
        disputed: staging.status === 'disputed',
        amount: amount,
        disputed_amount: staging.status === 'disputed' ? amount * 0.1 : null,
        invoice_date: staging.billing_date || staging.created_at?.split('T')[0],
        due_date: staging.due_date,
        // Additional fields from staging
        summary_invoice_id: staging.summary_invoice_id,
        pool: staging.pool,
        account_code: staging.account_code,
        billing_date: staging.billing_date,
        validation_status: staging.validation_status,
        vendor: staging.vendor,
        currency_code: staging.currency_code,
        billing_terms: staging.billing_terms,
        pdf_path: staging.pdf_path,
        excel_path: staging.excel_path,
        created_at: staging.created_at,
        processed_at: staging.processed_at
      };
      
      return invoiceRecord;
    });
  };

  const calculateDashboardMetrics = (data: any[]) => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate metrics from the invoice data
    let totalOutstanding = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let monthlyPaid = 0;
    let monthlyPaidCount = 0;
    
    const statusCounts: { [key: string]: number } = {};

    data.forEach(invoice => {
      // Count statuses
      const status = invoice.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Calculate financial metrics using actual invoice data
      const invoiceAmount = parseFloat(invoice.amount) || 0;
      const dueDate = new Date(invoice.due_date);
      const invoiceDate = new Date(invoice.invoice_date);
      
      if (status === 'Open' || status === 'Pending') {
        totalOutstanding += invoiceAmount;
      }
      
      if (dueDate < now && status !== 'Paid') {
        overdueAmount += invoiceAmount;
        overdueCount++;
      }
      
      if (status === 'Pending') {
        pendingAmount += invoiceAmount;
        pendingCount++;
      }
      
      // Monthly paid calculation
      if (invoiceDate >= currentMonth && status === 'Paid') {
        monthlyPaid += invoiceAmount;
        monthlyPaidCount++;
      }
    });

    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    setDashboardMetrics({
      totalOutstanding: Math.round(totalOutstanding),
      totalRecords: data.length,
      overdueAmount: Math.round(overdueAmount),
      overdueCount,
      pendingAmount: Math.round(pendingAmount),
      pendingCount,
      monthlyPaid: Math.round(monthlyPaid),
      monthlyPaidCount,
      statusBreakdown
    });
  };

  return {
    activityData,
    invoiceData,
    dashboardMetrics,
    loading,
    selectedRecord,
    setSelectedRecord,
    fetchDCLIData
  };
};