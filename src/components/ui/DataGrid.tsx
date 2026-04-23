import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { AgGridReactProps } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type CellValueChangedEvent,
  type RowClickedEvent,
  type RowStyle,
} from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

ModuleRegistry.registerModules([AllCommunityModule])

export interface DataGridProps<TRow = Record<string, unknown>> {
  rowData: TRow[]
  columnDefs: ColDef<TRow>[]
  onCellValueChanged?: (event: CellValueChangedEvent<TRow>) => void
  onRowClicked?: (event: RowClickedEvent<TRow>) => void
  rowStyle?: RowStyle
  height?: number
  loading?: boolean
  gridProps?: Partial<AgGridReactProps<TRow>>
}

export function DataGrid<TRow = Record<string, unknown>>({
  rowData,
  columnDefs,
  onCellValueChanged,
  onRowClicked,
  rowStyle,
  height = 500,
  loading = false,
  gridProps,
}: DataGridProps<TRow>) {
  const defaultColDef = useMemo<ColDef<TRow>>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    minWidth: 80,
  }), [])

  if (loading) {
    return (
      <div
        className="ag-theme-quartz w-full flex items-center justify-center bg-muted/30 rounded-md border"
        style={{ height }}
      >
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  return (
    <div className="ag-theme-quartz w-full" style={{ height }}>
      <AgGridReact<TRow>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={onCellValueChanged}
        onRowClicked={onRowClicked}
        rowStyle={rowStyle}
        {...gridProps}
      />
    </div>
  )
}

export default DataGrid
