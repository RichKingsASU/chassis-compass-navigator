import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, FileText, ExternalLink } from "lucide-react";

const ContactsAndResources = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Account Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="font-medium">SCSPA Account Manager</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href="mailto:support@scspa.com" className="hover:underline">
                support@scspa.com
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <a href="tel:+18005551234" className="hover:underline">
                1-800-555-1234
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Billing Support</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href="mailto:billing@scspa.com" className="hover:underline">
                billing@scspa.com
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Technical Support</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href="mailto:tech@scspa.com" className="hover:underline">
                tech@scspa.com
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">SCSPA Portal Guide</span>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>

            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Payment Terms & Conditions</span>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>

            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Equipment Guidelines</span>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>

            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">FAQ & Support Articles</span>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsAndResources;
