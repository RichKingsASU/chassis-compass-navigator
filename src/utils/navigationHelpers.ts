
interface NavItem {
  title: string;
  path: string;
  subItems?: { title: string; path: string }[];
}

/**
 * Determines the page title based on the current location pathname and navigation items
 */
export const getPageTitle = (pathname: string, navItems: NavItem[], locationState?: any): string => {
  // Check for invoice line item detail pages - use invoice number from state if available
  const invoiceLineMatch = pathname.match(/\/vendors\/[^/]+\/invoice-line\/([^/]+)/);
  if (invoiceLineMatch) {
    return locationState?.invoiceNumber || 'Loading...';
  }
  
  // Check for invoice review/detail pages - use invoice number from state if available
  const invoiceReviewMatch = pathname.match(/\/vendors\/[^/]+\/invoices\/([^/]+)\/(review|detail|validate)/);
  if (invoiceReviewMatch) {
    return locationState?.invoiceNumber || locationState?.summary_invoice_id || 'Invoice Details';
  }
  
  // First, look for direct matches with main nav items
  const directMatch = navItems.find(item => item.path === pathname);
  if (directMatch) return directMatch.title;
  
  // Next, check for matches with subitems
  for (const item of navItems) {
    if (item.subItems) {
      const subItemMatch = item.subItems.find(subItem => subItem.path === pathname);
      if (subItemMatch) return subItemMatch.title;
    }
  }
  
  // Default to Dashboard if no match is found
  return 'Dashboard';
};
