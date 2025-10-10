import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, FileText } from "lucide-react";

const ContactsAndResources = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Account Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <div className="font-medium">Support Email</div>
              <div className="text-sm text-muted-foreground">support@vendor.com</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <div className="font-medium">Support Phone</div>
              <div className="text-sm text-muted-foreground">1-800-VENDOR</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <a href="#" className="text-sm hover:underline">Invoice Guidelines</a>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <a href="#" className="text-sm hover:underline">Dispute Process</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsAndResources;
