import type { ReactNode } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridOptions } from "ag-grid-community";
import {
  AllCommunityModule,
  ClientSideRowModelModule,
  ModuleRegistry,
  NumberEditorModule,
  NumberFilterModule,
  TextFilterModule,
  ValidationModule,
} from "ag-grid-community";
import { AgChartsEnterpriseModule } from "ag-charts-enterprise";
import {
  MasterDetailModule,
  ServerSideRowModelModule,
  SetFilterModule,
  SparklinesModule,
  ContextMenuModule,
} from "ag-grid-enterprise";
import { gridTheme } from "~/utils/ag-grid-theme";

ModuleRegistry.registerModules([
  AllCommunityModule,
  ClientSideRowModelModule,
  MasterDetailModule,
  SetFilterModule,
  ServerSideRowModelModule,
  SparklinesModule.with(AgChartsEnterpriseModule),
  ContextMenuModule,
  ValidationModule,
  NumberFilterModule,
  NumberEditorModule,
  TextFilterModule,
]);

export interface AgGridTableProps<TData extends object = any> {
  columnDefs: ColDef<TData>[];
  rowData?: TData[];
  gridOptions?: GridOptions<TData>;
  height?: number | string;
  className?: string;
  header?: ReactNode;
  quickFilterText?: string;
}

export function AgGridTable<TData extends object = any>({
  columnDefs,
  rowData,
  gridOptions,
  height = 500,
  className = "",
  header,
  quickFilterText,
}: AgGridTableProps<TData>) {
  const isInfiniteOrServerSide =
    gridOptions?.rowModelType === "infinite" ||
    gridOptions?.rowModelType === "serverSide";

  return (
    <div className={`copa:flex copa:flex-col copa:gap-2 ${className}`}>
      {header ? <div>{header}</div> : null}
      <div
        style={{
          height: typeof height === "number" ? `${height}px` : height,
        }}
      >
        <AgGridReact<TData>
          theme={gridTheme}
          columnDefs={columnDefs}
          {...(!isInfiniteOrServerSide && rowData ? { rowData } : {})}
          animateRows
          quickFilterText={quickFilterText}
          {...gridOptions}
        />
      </div>
    </div>
  );
}
