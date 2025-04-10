
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
    <DialogFooter className="flex justify-end gap-2 mt-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        disabled={isUploading}
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={isUploading}
        className="min-w-[120px]"
      >
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
