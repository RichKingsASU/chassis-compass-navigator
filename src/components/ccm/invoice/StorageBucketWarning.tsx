import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
const StorageBucketWarning: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  return;
};
export default StorageBucketWarning;