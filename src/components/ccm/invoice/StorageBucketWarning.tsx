
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const StorageBucketWarning: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <Card className="border-amber-500">
      <CardHeader className="bg-amber-50 text-amber-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <CardTitle className="text-base">Storage Setup Required</CardTitle>
        </div>
        <CardDescription className="text-amber-700">
          You need to create a storage bucket named 'invoices' in your Supabase project for file uploads to work.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Run the following SQL in your Supabase SQL editor to create the required storage bucket:
        </p>
        <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
          {`-- Create a new storage bucket named 'invoices'
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true);

-- Allow public access to all files in the invoices bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR ALL USING (bucket_id = 'invoices');`}
        </pre>
      </CardContent>
    </Card>
  );
};

export default StorageBucketWarning;
