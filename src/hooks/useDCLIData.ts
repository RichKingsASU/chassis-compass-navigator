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
        .from('dcli_activity')
        .select('*')
        .order('created_date', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setInvoiceData(data);
        calculateDashboardMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching DCLI data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to fetch DCLI activity data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardMetrics = (data: any[]) => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate metrics from the data
    let totalOutstanding = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let monthlyPaid = 0;
    let monthlyPaidCount = 0;
    
    const statusCounts: { [key: string]: number } = {};

    data.forEach(record => {
      // Count statuses
      const status = record.reservation_status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Calculate financial metrics (using mock logic since we don't have specific financial fields)
      const daysSinceOut = record.days_out || 0;
      const estimatedValue = Math.random() * 5000 + 1000; // Mock calculation
      
      if (status === 'Active' || status === 'Pending') {
        totalOutstanding += estimatedValue;
      }
      
      if (daysSinceOut > 30) {
        overdueAmount += estimatedValue;
        overdueCount++;
      }
      
      if (status === 'Pending') {
        pendingAmount += estimatedValue;
        pendingCount++;
      }
      
      // Mock monthly paid calculation
      const recordDate = new Date(record.created_date || Date.now());
      if (recordDate >= currentMonth && status === 'Completed') {
        monthlyPaid += estimatedValue;
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
    invoiceData,
    dashboardMetrics,
    loading,
    selectedRecord,
    setSelectedRecord,
    fetchDCLIData
  };
};