import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, ArrowUpRight } from "lucide-react";

const AccountContacts = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Account Contact Information</CardTitle>
        <CardDescription>Your DCLI account representatives</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <Phone className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div className="flex-1">
            <div className="font-medium">Customer Support</div>
            <div className="text-sm text-muted-foreground">(800) 555-1234</div>
            <div className="text-xs text-muted-foreground mt-1">Available M-F, 8AM-8PM EST</div>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div className="flex-1">
            <div className="font-medium">Account Representative</div>
            <div className="text-sm text-muted-foreground">Sarah Johnson</div>
            <div className="text-sm text-primary">sarah.johnson@dcli.com</div>
            <div className="text-xs text-muted-foreground mt-1">Response within 24 hours</div>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <ArrowUpRight className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div className="flex-1">
            <div className="font-medium">Escalation Contact</div>
            <div className="text-sm text-muted-foreground">Robert Chen, Regional Manager</div>
            <div className="text-sm text-primary">robert.chen@dcli.com</div>
            <div className="text-sm text-muted-foreground">(800) 555-5678 ext. 342</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountContacts;
