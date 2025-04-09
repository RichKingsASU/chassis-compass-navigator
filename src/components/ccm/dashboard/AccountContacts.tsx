
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, ArrowUpRight } from "lucide-react";

const AccountContacts = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Account Contact Information</CardTitle>
        <CardDescription>Your CCM account representatives</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Customer Support</h4>
            <p className="text-sm text-muted-foreground">(800) 555-1234</p>
            <p className="text-xs text-muted-foreground mt-1">Available M-F, 8AM-8PM EST</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Account Representative</h4>
            <p className="text-sm text-muted-foreground">Sarah Johnson</p>
            <p className="text-sm text-muted-foreground">sarah.johnson@ccm.com</p>
            <p className="text-xs text-muted-foreground mt-1">Response within 24 hours</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Escalation Contact</h4>
            <p className="text-sm text-muted-foreground">Robert Chen, Regional Manager</p>
            <p className="text-sm text-muted-foreground">robert.chen@ccm.com</p>
            <p className="text-xs text-muted-foreground mt-1">(800) 555-5678 ext. 342</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountContacts;
