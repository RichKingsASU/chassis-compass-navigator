
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';

interface TMSTabPlaceholderProps {
  icon: LucideIcon;
  message: string;
}

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
