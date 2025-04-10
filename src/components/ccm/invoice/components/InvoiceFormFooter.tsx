
import React from 'react';
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface InvoiceFormFooterProps {
  isUploading: boolean;
  onCancel: () => void;
}

const InvoiceFormFooter: React.FC<InvoiceFormFooterProps> = ({
  isUploading,
  onCancel
}) => {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isUploading}>
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : "Upload Invoice"}
      </Button>
    </DialogFooter>
  );
};

export default InvoiceFormFooter;
