import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const QuickResources = () => {
  const resources = [
    {
      title: "DCLI Customer Portal",
      description: "Access your full DCLI account",
      url: "#",
      color: "text-blue-600"
    },
    {
      title: "Service Bulletins",
      description: "Latest operational updates",
      url: "#",
      color: "text-green-600"
    },
    {
      title: "Chassis Location Guide",
      description: "Find nearest drop-off locations",
      url: "#",
      color: "text-purple-600"
    },
    {
      title: "Dispute Resolution Guide",
      description: "How to dispute incorrect charges",
      url: "#",
      color: "text-red-600"
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Quick Resources</CardTitle>
        <CardDescription>Helpful links and resources</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {resources.map((resource, index) => (
          <a
            key={index}
            href={resource.url}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                <ExternalLink className={`h-4 w-4 ${resource.color}`} />
                {resource.title}
              </div>
              <div className="text-sm text-muted-foreground">{resource.description}</div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickResources;
