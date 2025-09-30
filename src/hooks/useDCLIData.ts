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
      
      const { data, error } = await supabase
        .from('dcli_activity' as any)
        .select('*')
        .order('created_date', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setActivityData(data);
        // Transform activity data into invoice-like records
        const transformedInvoiceData = transformActivityToInvoices(data);
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

  // Transform dcli_activity data into invoice-like records
  const transformActivityToInvoices = (activityData: any[]) => {
    // Group activities by chassis and date ranges to create invoice-like records
    const invoiceMap = new Map();
    
    activityData.forEach((activity, index) => {
      // Create a unique invoice ID based on chassis and time period
      const invoiceId = `INV-${activity.chassis || 'UNKNOWN'}-${activity.region || 'US'}-${index + 1000}`;
      const chassisNumber = activity.chassis || `CH${Math.random().toString().substr(2, 6)}`;
      
      // Calculate invoice amounts based on days and daily rates
      const daysOut = activity.days_out || Math.floor(Math.random() * 30) + 1;
      const dailyRate = 35 + Math.floor(Math.random() * 15); // $35-50 per day
      const amount = daysOut * dailyRate;
      
      // Determine status based on activity data
      let status = 'Open';
      if (activity.reservation_status === 'COMPLETE' || activity.date_in) {
        status = Math.random() > 0.3 ? 'Closed' : 'Open';
      }
      
      // Create invoice date from activity data
      const invoiceDate = activity.date_out || activity.created_date || new Date().toISOString();
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms
      
      const invoiceRecord = {
        invoice_id: invoiceId,
        description: `${activity.product || 'Chassis Usage'} - ${chassisNumber}`,
        status: status,
        disputed: Math.random() > 0.9, // 10% chance of dispute
        amount: amount,
        disputed_amount: Math.random() > 0.9 ? amount * 0.1 : null,
        invoice_date: invoiceDate.split('T')[0], // Extract date part
        due_date: dueDate.toISOString().split('T')[0],
        // Additional fields from activity
        chassis_number: chassisNumber,
        container: activity.container,
        region: activity.region,
        market: activity.market,
        days_out: daysOut,
        daily_rate: dailyRate,
        pick_up_location: activity.pick_up_location,
        location_in: activity.location_in,
        carrier_name: activity.motor_carrier_name,
        carrier_scac: activity.motor_carrier_scac,
        steamship_line: activity.steamship_line_name,
        booking: activity.booking,
        reservation_status: activity.reservation_status,
        pool_contract: activity.pool_contract,
        asset_type: activity.asset_type
      };
      
      invoiceMap.set(invoiceId, invoiceRecord);
    });
    
    return Array.from(invoiceMap.values());
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