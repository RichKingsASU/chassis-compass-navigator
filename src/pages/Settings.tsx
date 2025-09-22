import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Truck, 
  UserCircle, 
  MapPin, 
  Star, 
  Building2,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SettingsItem {
  id: string;
  name: string;
  [key: string]: any;
}

const Settings = () => {
  const [customers, setCustomers] = useState<SettingsItem[]>([
    { id: '1', name: 'ACME Corp', contact: 'John Doe', email: 'john@acme.com', status: 'Active' },
    { id: '2', name: 'Global Logistics', contact: 'Jane Smith', email: 'jane@global.com', status: 'Active' }
  ]);

  const [carriers, setCarriers] = useState<SettingsItem[]>([
    { id: '1', name: 'Express Transport', scac: 'EXPT', status: 'Active' },
    { id: '2', name: 'Fast Freight', scac: 'FFRT', status: 'Inactive' }
  ]);

  const [drivers, setDrivers] = useState<SettingsItem[]>([
    { id: '1', name: 'Mike Johnson', license: 'DL123456', carrier: 'Express Transport', status: 'Available' },
    { id: '2', name: 'Sarah Wilson', license: 'DL789012', carrier: 'Fast Freight', status: 'On Route' }
  ]);

  const [yards, setYards] = useState<SettingsItem[]>([
    { id: '1', name: 'Port of LA Yard', location: 'Los Angeles, CA', capacity: '500', status: 'Active' },
    { id: '2', name: 'JED Terminal', location: 'Jacksonville, FL', capacity: '300', status: 'Active' }
  ]);

  const [favoriteSpots, setFavoriteSpots] = useState<SettingsItem[]>([
    { id: '1', name: 'Loading Dock A', location: 'Warehouse District', type: 'Loading' },
    { id: '2', name: 'Fuel Station', location: 'Highway 101', type: 'Fuel' }
  ]);

  const [users, setUsers] = useState<SettingsItem[]>([
    { id: '1', name: 'Admin User', email: 'admin@company.com', role: 'Administrator', status: 'Active' },
    { id: '2', name: 'Manager User', email: 'manager@company.com', role: 'Manager', status: 'Active' }
  ]);

  const renderSettingsTable = (
    items: SettingsItem[], 
    columns: string[], 
    title: string, 
    icon: React.ReactNode,
    onAdd: () => void
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Manage your {title.toLowerCase()}</CardDescription>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add {title.slice(0, -1)}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New {title.slice(0, -1)}</DialogTitle>
              <DialogDescription>
                Create a new {title.toLowerCase().slice(0, -1)} entry
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" className="col-span-3" />
              </div>
              {columns.slice(1).map((column) => (
                <div key={column} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={column} className="text-right">
                    {column.charAt(0).toUpperCase() + column.slice(1)}
                  </Label>
                  <Input id={column} className="col-span-3" />
                </div>
              ))}
            </div>
            <Button type="submit" className="ml-auto">Save</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">ID: {item.id}</p>
                </div>
                {columns.slice(1, 3).map((column) => (
                  <div key={column}>
                    <p className="text-sm text-muted-foreground">{column.charAt(0).toUpperCase() + column.slice(1)}</p>
                    <p className="font-medium">{item[column]}</p>
                  </div>
                ))}
                {item.status && (
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={item.status === 'Active' || item.status === 'Available' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your system configurations and data
          </p>
        </div>

        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="carriers" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Carriers
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="yards" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Yards
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            {renderSettingsTable(
              customers,
              ['name', 'contact', 'email', 'status'],
              'Customers',
              <Building2 className="h-5 w-5 text-primary" />,
              () => console.log('Add customer')
            )}
          </TabsContent>

          <TabsContent value="carriers">
            {renderSettingsTable(
              carriers,
              ['name', 'scac', 'status'],
              'Carriers',
              <Truck className="h-5 w-5 text-primary" />,
              () => console.log('Add carrier')
            )}
          </TabsContent>

          <TabsContent value="drivers">
            {renderSettingsTable(
              drivers,
              ['name', 'license', 'carrier', 'status'],
              'Drivers',
              <UserCircle className="h-5 w-5 text-primary" />,
              () => console.log('Add driver')
            )}
          </TabsContent>

          <TabsContent value="yards">
            {renderSettingsTable(
              yards,
              ['name', 'location', 'capacity', 'status'],
              'Yards',
              <MapPin className="h-5 w-5 text-primary" />,
              () => console.log('Add yard')
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {renderSettingsTable(
              favoriteSpots,
              ['name', 'location', 'type'],
              'Favorite Spots',
              <Star className="h-5 w-5 text-primary" />,
              () => console.log('Add favorite spot')
            )}
          </TabsContent>

          <TabsContent value="users">
            {renderSettingsTable(
              users,
              ['name', 'email', 'role', 'status'],
              'Users',
              <Users className="h-5 w-5 text-primary" />,
              () => console.log('Add user')
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;