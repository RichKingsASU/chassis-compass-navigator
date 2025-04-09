
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';

/**
 * Props for the TMSTabPlaceholder component
 */
interface TMSTabPlaceholderProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Message to display in the placeholder */
  message: string;
}

/**
 * A placeholder component for empty tab content
 * Used to display an icon and message when a tab has no content
 */
const TMSTabPlaceholder: React.FC<TMSTabPlaceholderProps> = ({ icon: Icon, message }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-md">
          <div className="text-center">
            <Icon size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TMSTabPlaceholder;
