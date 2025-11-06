import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeChassisId(chassisId: string | null): string {
  if (!chassisId) return "N/A";
  // Remove spaces and dashes from chassis ID
  return chassisId.replace(/[\s-]/g, '');
}
