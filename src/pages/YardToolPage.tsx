import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Warehouse } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getAllYards, YardConfig } from '@/features/yard/services/yardService';
import InventoryDashboard from '@/features/yard/components/InventoryDashboard';
import BillingAnalytics from '@/features/yard/components/BillingAnalytics';
import ReportsHistory from '@/features/yard/components/ReportsHistory';
import YardConfigPanel from '@/features/yard/components/YardConfigPanel';

type UserRole = 'YARD_OPERATOR' | 'INTERNAL' | 'ADMIN';

function getUserRole(_user: any): UserRole {
  // Map the app's auth user to yard UserRole
  // For now, treat all authenticated users as ADMIN for full access
  // In production, check user metadata or a roles table
  return 'ADMIN';
}

export default function YardToolPage() {
  const { user } = useAuth();
  const [yards, setYards] = useState<YardConfig[]>([]);
  const [selectedYardId, setSelectedYardId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const userRole = getUserRole(user);
  const selectedYard = yards.find((y) => y.id === selectedYardId) || null;

  useEffect(() => {
    async function loadYards() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllYards();
        setYards(data);
        if (data.length === 1) {
          setSelectedYardId(data[0].id);
        } else if (data.length > 1) {
          setSelectedYardId(data[0].id);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load yards');
      } finally {
        setLoading(false);
      }
    }
    loadYards();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading yards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-destructive font-semibold">Error loading yards</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Warehouse className="h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold">Yard Management</h1>
            <p className="text-muted-foreground">Inventory, billing, and audit tracking</p>
          </div>
        </div>

        {/* Yard Selector - show if multiple yards */}
        {yards.length > 1 && (
          <Select value={selectedYardId} onValueChange={setSelectedYardId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a yard" />
            </SelectTrigger>
            <SelectContent>
              {yards.map((yard) => (
                <SelectItem key={yard.id} value={yard.id}>
                  {yard.name} ({yard.shortCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tabs */}
      {selectedYard ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            {userRole === 'ADMIN' && (
              <TabsTrigger value="config">Yard Config</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <InventoryDashboard yardId={selectedYard.id} yardName={selectedYard.name} />
          </TabsContent>

          <TabsContent value="records" className="mt-6">
            <ReportsHistory yardId={selectedYard.id} yardName={selectedYard.name} />
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <BillingAnalytics
              yardId={selectedYard.id}
              yardConfig={{
                capacity: selectedYard.capacity,
                dailyRate: selectedYard.dailyRate,
                overageRate: selectedYard.overageRate,
                name: selectedYard.name,
              }}
            />
          </TabsContent>

          {userRole === 'ADMIN' && (
            <TabsContent value="config" className="mt-6">
              <YardConfigPanel />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No yards configured. {userRole === 'ADMIN' ? 'Use the Config tab to add a yard.' : 'Contact an admin to configure yards.'}</p>
        </div>
      )}
    </div>
  );
}
