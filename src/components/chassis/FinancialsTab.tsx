import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, differenceInDays } from 'date-fns';
import KPICard from "@/components/ccm/KPICard";

interface FinancialsTabProps {
  chassisId: string;
}

interface TMSFinancial {
  date_utc: string;
  revenue_usd: number;
  fuel_surcharge_usd: number;
  accessorials_usd: number;
}

interface EquipmentCost {
  cost_date_utc: string;
  cost_type: string;
  amount_usd: number;
  period: 'one_time' | 'daily' | 'monthly' | 'annual';
  description: string;
}

interface Repair {
  timestamp_utc: string;
  cost_usd: number;
}

const FinancialsTab: React.FC<FinancialsTabProps> = ({ chassisId }) => {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tmsFinancials, setTmsFinancials] = useState<TMSFinancial[]>([]);
  const [equipmentCosts, setEquipmentCosts] = useState<EquipmentCost[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancials();
  }, [chassisId, startDate, endDate]);

  const fetchFinancials = async () => {
    try {
      setLoading(true);

      // Check if this is a real UUID (not an MCL-only chassis identifier)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chassisId);
      
      if (!isUuid) {
        // MCL-only chassis don't have financial data in these tables
        setTmsFinancials([]);
        setEquipmentCosts([]);
        setRepairs([]);
        setLoading(false);
        return;
      }

      // Fetch TMS financials
      const { data: tmsData, error: tmsError } = await supabase
        .from('tms_load_financials')
        .select('*')
        .eq('chassis_id', chassisId)
        .gte('date_utc', startDate)
        .lte('date_utc', endDate)
        .order('date_utc', { ascending: false });

      if (tmsError) console.error('TMS Financials error:', tmsError);
      setTmsFinancials(tmsData || []);

      // Fetch equipment costs
      const { data: costsData, error: costsError } = await supabase
        .from('equipment_costs')
        .select('*')
        .eq('chassis_id', chassisId)
        .gte('cost_date_utc', startDate)
        .lte('cost_date_utc', endDate)
        .order('cost_date_utc', { ascending: false });

      if (costsError) console.error('Equipment Costs error:', costsError);
      setEquipmentCosts((costsData as EquipmentCost[]) || []);

      // Fetch repairs within date range
      const { data: repairsData, error: repairsError } = await supabase
        .from('repairs')
        .select('timestamp_utc, cost_usd')
        .eq('chassis_id', chassisId)
        .gte('timestamp_utc', startDate)
        .lte('timestamp_utc', endDate);

      if (repairsError) console.error('Repairs error:', repairsError);
      setRepairs(repairsData || []);

    } catch (error) {
      console.error('Error fetching financials:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const daysInRange = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    const monthsApprox = daysInRange / 30;

    // Calculate total revenue
    const totalRevenue = tmsFinancials.reduce(
      (sum, f) => sum + Number(f.revenue_usd) + Number(f.fuel_surcharge_usd) + Number(f.accessorials_usd),
      0
    );

    // Calculate repair costs
    const totalRepairCosts = repairs.reduce((sum, r) => sum + Number(r.cost_usd), 0);

    // Calculate equipment costs
    let totalEquipmentCosts = 0;
    equipmentCosts.forEach(cost => {
      const amount = Number(cost.amount_usd);
      switch (cost.period) {
        case 'daily':
          totalEquipmentCosts += amount * daysInRange;
          break;
        case 'monthly':
          totalEquipmentCosts += amount * monthsApprox;
          break;
        case 'annual':
          totalEquipmentCosts += amount * (daysInRange / 365);
          break;
        case 'one_time':
          totalEquipmentCosts += amount;
          break;
      }
    });

    const totalCosts = totalRepairCosts + totalEquipmentCosts;
    const grossMargin = totalRevenue - totalCosts;
    const revenuePerDay = daysInRange > 0 ? totalRevenue / daysInRange : 0;
    const costPerDay = daysInRange > 0 ? totalCosts / daysInRange : 0;

    return {
      totalRevenue,
      totalCosts,
      grossMargin,
      daysInRange,
      revenuePerDay,
      costPerDay,
      totalRepairCosts,
      totalEquipmentCosts
    };
  }, [tmsFinancials, equipmentCosts, repairs, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">From</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">To</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description="All revenue sources"
          icon="dollar"
        />
        <KPICard
          title="Total Costs"
          value={`$${metrics.totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description="Equipment + Repairs"
          icon="dollar"
        />
        <KPICard
          title="Gross Margin"
          value={`$${metrics.grossMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description="Revenue - Costs"
          icon="chart"
        />
        <KPICard
          title="Days in Range"
          value={metrics.daysInRange.toString()}
          description={`${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d')}`}
          icon="chart"
        />
        <KPICard
          title="Revenue/Day"
          value={`$${metrics.revenuePerDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description="Average daily revenue"
          icon="dollar"
        />
        <KPICard
          title="Cost/Day"
          value={`$${metrics.costPerDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description="Average daily cost"
          icon="dollar"
        />
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tmsFinancials.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No revenue entries found</p>
            ) : (
              tmsFinancials.map((entry, index) => {
                const totalEntry = Number(entry.revenue_usd) + Number(entry.fuel_surcharge_usd) + Number(entry.accessorials_usd);
                return (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">{format(new Date(entry.date_utc), 'PPP')}</div>
                      <div className="text-xs text-muted-foreground">
                        Revenue: ${Number(entry.revenue_usd).toFixed(2)} | 
                        Fuel: ${Number(entry.fuel_surcharge_usd).toFixed(2)} | 
                        Accessorials: ${Number(entry.accessorials_usd).toFixed(2)}
                      </div>
                    </div>
                    <div className="font-semibold">${totalEntry.toFixed(2)}</div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Repair Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {repairs.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No repair costs in this period</p>
              ) : (
                <>
                  {repairs.map((repair, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2">
                      <div className="text-sm">{format(new Date(repair.timestamp_utc), 'PPP')}</div>
                      <div className="font-semibold">${Number(repair.cost_usd).toFixed(2)}</div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 font-bold">
                    <div>Total Repair Costs</div>
                    <div>${metrics.totalRepairCosts.toFixed(2)}</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {equipmentCosts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No equipment costs in this period</p>
              ) : (
                <>
                  {equipmentCosts.map((cost, index) => {
                    const daysInRange = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
                    const monthsApprox = daysInRange / 30;
                    let calculatedCost = Number(cost.amount_usd);
                    
                    switch (cost.period) {
                      case 'daily':
                        calculatedCost *= daysInRange;
                        break;
                      case 'monthly':
                        calculatedCost *= monthsApprox;
                        break;
                      case 'annual':
                        calculatedCost *= (daysInRange / 365);
                        break;
                    }

                    return (
                      <div key={index} className="border-b pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{cost.cost_type}</div>
                            <div className="text-xs text-muted-foreground">
                              {cost.description} | {cost.period} (${Number(cost.amount_usd).toFixed(2)})
                            </div>
                          </div>
                          <div className="font-semibold">${calculatedCost.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-2 font-bold">
                    <div>Total Equipment Costs</div>
                    <div>${metrics.totalEquipmentCosts.toFixed(2)}</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialsTab;
