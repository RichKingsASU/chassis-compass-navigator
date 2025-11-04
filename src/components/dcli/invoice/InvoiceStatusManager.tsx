import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';

interface InvoiceStatusManagerProps {
  currentStatus: string;
  currentValidationStatus: string;
  onSave: (status: string, validationStatus: string) => Promise<void>;
}

const INVOICE_STATUSES = [
  { value: 'pending_validation', label: 'Pending Validation' },
  { value: 'validated', label: 'Validated' },
  { value: 'in_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];

const VALIDATION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status.includes('approved') || status.includes('completed')) return 'default';
  if (status.includes('pending') || status.includes('in_progress')) return 'secondary';
  if (status.includes('rejected') || status.includes('failed') || status.includes('disputed')) return 'destructive';
  return 'outline';
};

const InvoiceStatusManager = ({
  currentStatus,
  currentValidationStatus,
  onSave,
}: InvoiceStatusManagerProps) => {
  const [status, setStatus] = useState(currentStatus);
  const [validationStatus, setValidationStatus] = useState(currentValidationStatus);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = status !== currentStatus || validationStatus !== currentValidationStatus;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(status, validationStatus);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Current Status:</span>
          <Badge variant={getStatusVariant(currentStatus)}>
            {INVOICE_STATUSES.find(s => s.value === currentStatus)?.label || currentStatus}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Validation:</span>
          <Badge variant={getStatusVariant(currentValidationStatus)}>
            {VALIDATION_STATUSES.find(s => s.value === currentValidationStatus)?.label || currentValidationStatus}
          </Badge>
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Invoice Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Validation Status</label>
          <Select value={validationStatus} onValueChange={setValidationStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VALIDATION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="min-w-24"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default InvoiceStatusManager;
