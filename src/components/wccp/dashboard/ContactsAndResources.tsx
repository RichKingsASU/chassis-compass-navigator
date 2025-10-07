import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, FileText, ExternalLink, Users } from 'lucide-react';

const ContactsAndResources = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Account Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            WCCP Account Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Account Manager</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Contact your WCCP representative</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>Pending configuration</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Billing Support</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>billing@wccp.com</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              WCCP Customer Portal
            </a>
          </Button>
          
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <FileText className="mr-2 h-4 w-4" />
              Rate Schedules
            </a>
          </Button>
          
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <FileText className="mr-2 h-4 w-4" />
              Terms & Conditions
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsAndResources;
