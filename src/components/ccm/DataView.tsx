import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvoiceData } from "@/hooks/useInvoiceData";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const DataView = () => {
  const { invoices, excelData, loading, excelLoading, handleFileDownload } = useInvoiceData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Data View</h2>
        <p className="text-muted-foreground">
          View and analyze all your CCM data including invoices and uploaded spreadsheet data.
        </p>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Invoice Data</TabsTrigger>
          <TabsTrigger value="excel">Spreadsheet Data</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Data Overview
              </CardTitle>
              <CardDescription>
                All uploaded invoices and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading invoice data...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>File Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No invoice data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                            <TableCell>${invoice.total_amount_usd.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={
                                invoice.status === 'paid' ? 'default' :
                                invoice.status === 'pending' ? 'secondary' :
                                invoice.status === 'disputed' ? 'destructive' : 'outline'
                              }>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{invoice.file_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {invoice.file_path && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleFileDownload(invoice.file_path!, invoice.file_name!)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Spreadsheet Data Overview
              </CardTitle>
              <CardDescription>
                Data extracted from uploaded Excel files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {excelLoading ? (
                <div className="text-center py-8">Loading spreadsheet data...</div>
              ) : (
                <div className="space-y-4">
                  {excelData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No spreadsheet data available
                    </div>
                  ) : (
                    excelData.map((data) => (
                      <Card key={data.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{data.sheet_name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant={data.validated ? "default" : "secondary"}>
                                {data.validated ? "Validated" : "Pending"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {new Date(data.created_at).toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground mb-3">
                            Data rows: {Array.isArray(data.row_data) ? data.row_data.length : 1}
                          </div>
                          {Array.isArray(data.row_data) && data.row_data.length > 0 && (
                            <div className="rounded-md border max-h-64 overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {Object.keys(data.row_data[0]).map((key) => (
                                      <TableHead key={key} className="whitespace-nowrap">
                                        {key}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {data.row_data.slice(0, 5).map((row, index) => (
                                    <TableRow key={index}>
                                      {Object.values(row).map((value, cellIndex) => (
                                        <TableCell key={cellIndex} className="whitespace-nowrap">
                                          {String(value || '')}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                  {data.row_data.length > 5 && (
                                    <TableRow>
                                      <TableCell 
                                        colSpan={Object.keys(data.row_data[0]).length}
                                        className="text-center text-muted-foreground"
                                      >
                                        ... and {data.row_data.length - 5} more rows
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataView;