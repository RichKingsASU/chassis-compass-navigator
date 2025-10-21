/**
 * Convert Excel serial date number to JavaScript Date string in YYYY-MM-DD format
 * Excel serial dates start from 1900-01-01
 * @param excelDate - Excel serial number (e.g., 45915)
 * @returns Date string in YYYY-MM-DD format or null if invalid
 */
export const excelDateToJSDate = (excelDate: any): string | null => {
  if (!excelDate || isNaN(excelDate)) return null;
  const excelNum = parseFloat(excelDate);
  // Excel date serial number starts from 1900-01-01
  // Subtract 25569 days to get Unix epoch offset
  const date = new Date((excelNum - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
};

/**
 * Check if a value looks like an Excel serial date
 * @param value - Value to check
 * @returns true if value appears to be an Excel date
 */
export const isExcelSerialDate = (value: any): boolean => {
  return typeof value === 'number' && value > 40000 && value < 50000;
};

/**
 * Format a date value for display, handling Excel serial dates
 * @param value - Date value (can be Excel serial number, ISO string, or Date object)
 * @returns Formatted date string or original value if not a date
 */
export const formatDateValue = (value: any): string => {
  if (!value || value === '') return '—';
  
  // Handle Excel serial dates
  if (isExcelSerialDate(value)) {
    return excelDateToJSDate(value) || '—';
  }
  
  // Handle ISO date strings
  if (typeof value === 'string' && value.includes('-')) {
    return value.split('T')[0];
  }
  
  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  return String(value);
};
