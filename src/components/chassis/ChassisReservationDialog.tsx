import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ChassisReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chassisId: string;
  onReservationCreated?: () => void;
}

const ChassisReservationDialog: React.FC<ChassisReservationDialogProps> = ({
  open,
  onOpenChange,
  chassisId,
  onReservationCreated,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    checkInDate: '',
    checkInTime: '',
    unitNumber: '',
    accountManager: '',
    notes: '',
    sslSize: '',
    plannedExitDate: '',
    reservationType: '',
    eqType: '',
    loadType: '',
    bookingNumber: '',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('chassis_reservations')
        .insert({
          chassis_id: chassisId,
          check_in_date: formData.checkInDate,
          check_in_time: formData.checkInTime,
          unit_number: formData.unitNumber,
          account_manager: formData.accountManager,
          notes: formData.notes,
          ssl_size: formData.sslSize,
          planned_exit_date: formData.plannedExitDate || null,
          reservation_type: formData.reservationType,
          eq_type: formData.eqType,
          load_type: formData.loadType,
          booking_number: formData.bookingNumber,
          location: formData.location,
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: "Reservation Created",
        description: `Chassis ${chassisId} has been reserved successfully.`,
      });

      onOpenChange(false);
      onReservationCreated?.();
      
      // Reset form
      setFormData({
        checkInDate: '',
        checkInTime: '',
        unitNumber: '',
        accountManager: '',
        notes: '',
        sslSize: '',
        plannedExitDate: '',
        reservationType: '',
        eqType: '',
        loadType: '',
        bookingNumber: '',
        location: '',
      });
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create reservation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reserve Chassis: {chassisId}</DialogTitle>
          <DialogDescription>
            Complete the form below to reserve this chassis.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Check In Date */}
            <div className="space-y-2">
              <Label htmlFor="checkInDate">Check In Date *</Label>
              <Input
                id="checkInDate"
                type="date"
                required
                value={formData.checkInDate}
                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
              />
            </div>

            {/* Check In Time */}
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Check In Time *</Label>
              <Input
                id="checkInTime"
                type="time"
                required
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
              />
            </div>

            {/* Unit Number */}
            <div className="space-y-2">
              <Label htmlFor="unitNumber">Unit #</Label>
              <Input
                id="unitNumber"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                placeholder="Enter unit number"
              />
            </div>

            {/* Chassis (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="chassis">Chassis</Label>
              <Input
                id="chassis"
                value={chassisId}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Account Manager */}
            <div className="space-y-2">
              <Label htmlFor="accountManager">Account Manager</Label>
              <Input
                id="accountManager"
                value={formData.accountManager}
                onChange={(e) => setFormData({ ...formData, accountManager: e.target.value })}
                placeholder="Enter account manager"
              />
            </div>

            {/* SSL / Size */}
            <div className="space-y-2">
              <Label htmlFor="sslSize">SSL / Size</Label>
              <Select
                value={formData.sslSize}
                onValueChange={(value) => setFormData({ ...formData, sslSize: value })}
              >
                <SelectTrigger id="sslSize">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20ft">20ft</SelectItem>
                  <SelectItem value="40ft">40ft</SelectItem>
                  <SelectItem value="45ft">45ft</SelectItem>
                  <SelectItem value="53ft">53ft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Planned Exit Date */}
            <div className="space-y-2">
              <Label htmlFor="plannedExitDate">Planned Exit</Label>
              <Input
                id="plannedExitDate"
                type="date"
                value={formData.plannedExitDate}
                onChange={(e) => setFormData({ ...formData, plannedExitDate: e.target.value })}
              />
            </div>

            {/* Reservation Type */}
            <div className="space-y-2">
              <Label htmlFor="reservationType">Reserved/Carrier/Return Type</Label>
              <Select
                value={formData.reservationType}
                onValueChange={(value) => setFormData({ ...formData, reservationType: value })}
              >
                <SelectTrigger id="reservationType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="carrier">Carrier</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Equipment Type */}
            <div className="space-y-2">
              <Label htmlFor="eqType">EqType</Label>
              <Input
                id="eqType"
                value={formData.eqType}
                onChange={(e) => setFormData({ ...formData, eqType: e.target.value })}
                placeholder="Equipment type"
              />
            </div>

            {/* Load Type */}
            <div className="space-y-2">
              <Label htmlFor="loadType">LoadType</Label>
              <Input
                id="loadType"
                value={formData.loadType}
                onChange={(e) => setFormData({ ...formData, loadType: e.target.value })}
                placeholder="Load type"
              />
            </div>

            {/* Booking Number */}
            <div className="space-y-2">
              <Label htmlFor="bookingNumber">BookingNo</Label>
              <Input
                id="bookingNumber"
                value={formData.bookingNumber}
                onChange={(e) => setFormData({ ...formData, bookingNumber: e.target.value })}
                placeholder="Booking number"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Reservation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChassisReservationDialog;
