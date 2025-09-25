
import { useState } from 'react';
import { Invoice, InvoiceFilters } from './types';

export const useInvoiceFilters = (invoices: Invoice[]) => {
  const [filters, setFilters] = useState<InvoiceFilters>({
    selectedVendor: 'all',
    selectedStatus: 'all',
    selectedFileType: 'all',
    searchQuery: '',
  });

  const setSelectedVendor = (value: string) => {
    setFilters(prev => ({ ...prev, selectedVendor: value }));
  };

  const setSelectedStatus = (value: string) => {
    setFilters(prev => ({ ...prev, selectedStatus: value }));
  };

  const setSelectedFileType = (value: string) => {
    setFilters(prev => ({ ...prev, selectedFileType: value }));
  };

  const setSearchQuery = (value: string) => {
    setFilters(prev => ({ ...prev, searchQuery: value }));
  };

  const filteredInvoices = invoices.filter(invoice => {
    const vendorMatch = filters.selectedVendor === 'all' || invoice.provider === filters.selectedVendor;
    const statusMatch = filters.selectedStatus === 'all' || invoice.status === filters.selectedStatus;
    const fileTypeMatch = filters.selectedFileType === 'all' || invoice.fileType === filters.selectedFileType;
    const searchMatch = filters.searchQuery === '' || 
      invoice.invoice_number?.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
      invoice.reason_for_dispute?.toLowerCase().includes(filters.searchQuery.toLowerCase());
    
    // Debug logging
    console.log('Filtering invoice:', {
      invoice: invoice.invoice_number,
      fileType: invoice.fileType,
      selectedFileType: filters.selectedFileType,
      fileTypeMatch,
      vendorMatch,
      statusMatch,
      searchMatch
    });
    
    return vendorMatch && statusMatch && fileTypeMatch && searchMatch;
  });

  return {
    filters,
    setSelectedVendor,
    setSelectedStatus,
    setSelectedFileType,
    setSearchQuery,
    filteredInvoices
  };
};
