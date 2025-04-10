
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import InvoiceUploadForm from '../InvoiceUploadForm';
import { InvoiceFormProps } from '../schema/invoiceFormSchema';

interface InvoiceUploadDialogProps extends InvoiceFormProps {
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
}

const InvoiceUploadDialog: React.FC<InvoiceUploadDialogProps> = ({
  onSubmit,
  isUploading,
  openDialog,
  setOpenDialog
}) => {
  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <Upload className="h-4 w-4 mr-2" /> 
          Upload Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Invoice</DialogTitle>
          <DialogDescription>
            Complete the form below to upload a new invoice document
          </DialogDescription>
        </DialogHeader>

        <InvoiceUploadForm
          onSubmit={onSubmit}
          isUploading={isUploading}
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
        />
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceUploadDialog;
