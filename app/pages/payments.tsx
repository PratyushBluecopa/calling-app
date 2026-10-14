import { useMemo, useCallback, useState } from "react";
import { useDataset } from "@bluecopa/react";
import { IconAlertTriangle, IconLoader2, IconSearch } from "@tabler/icons-react";
import type { ColDef, GridReadyEvent } from "ag-grid-community";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { AgGridTable } from "~/components/ui/ag-grid-table";
import { createServerSideDatasource } from "~/utils/ag-grid-datasource";
import { Input } from "~/components/ui/input";

const DATASET_ID = "0a3be3311769d7e9edb830adf72e41d9";
const USE_SERVER_SIDE = false;

type PaymentRow = Record<string, unknown>;

function parseResponse(data: unknown): {
  rows: PaymentRow[];
  columns: string[];
} {
  const response = data as Record<string, unknown> | unknown[] | undefined;
  let rows: PaymentRow[] = [];
  let columns: string[] = [];

  if (Array.isArray(response)) {
    rows = response as PaymentRow[];
  } else if (response && typeof response === "object") {
    if ("data" in response && Array.isArray(response.data)) {
      rows = response.data as PaymentRow[];
    } else if ("records" in response && Array.isArray(response.records)) {
      rows = response.records as PaymentRow[];
    } else if ("rows" in response && Array.isArray(response.rows)) {
      rows = response.rows as PaymentRow[];
    }
    if ("columns" in response && Array.isArray(response.columns)) {
      columns = response.columns as string[];
    }
  }

  if (columns.length === 0 && rows.length > 0) {
    columns = Object.keys(rows[0]).filter(
      (key) => !key.startsWith("_") && key !== "id",
    );
  }

  return { rows, columns };
}

export default function Payments() {
  const [quickFilter, setQuickFilter] = useState("");

  const { data, isLoading, error } = useDataset(
    USE_SERVER_SIDE ? undefined! : DATASET_ID,
    { limit: 100 },
  );

  const { rows, columns } = useMemo(() => parseResponse(data), [data]);

  const onGridReady = useCallback((event: GridReadyEvent) => {
    if (!USE_SERVER_SIDE) return;
    const datasource = createServerSideDatasource({ tableId: DATASET_ID });
    event.api.setGridOption("serverSideDatasource", datasource);
  }, []);

  const columnDefs: ColDef[] = useMemo(
    () =>
      columns.map((col) => ({
        field: col,
        headerName: col
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .trim(),
      })),
    [columns],
  );

  if (isLoading) {
    return (
      <>
        <h1 className="copa:text-2xl copa:font-semibold">Payments</h1>
        <Card className="copa:max-w-md">
          <CardContent className="copa:flex copa:items-center copa:gap-3 copa:py-12 copa:justify-center">
            <IconLoader2 className="copa:size-5 copa:animate-spin copa:text-primary" />
            <span className="copa:text-sm copa:text-muted-foreground">
              Loading payments data…
            </span>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <h1 className="copa:text-2xl copa:font-semibold">Payments</h1>
        <Card className="copa:max-w-lg">
          <CardContent className="copa:flex copa:items-start copa:gap-3 copa:py-8">
            <IconAlertTriangle className="copa:size-5 copa:text-destructive copa:shrink-0 copa:mt-0.5" />
            <div className="copa:flex copa:flex-col copa:gap-1">
              <span className="copa:text-sm copa:font-medium">
                Failed to load payments
              </span>
              <span className="copa:text-xs copa:text-muted-foreground">
                {error.message}
              </span>
              <span className="copa:text-xs copa:text-muted-foreground copa:mt-1">
                Dataset ID: {DATASET_ID}
              </span>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="copa:flex copa:items-center copa:justify-between">
        <h1 className="copa:text-2xl copa:font-semibold">Payments</h1>
        <span className="copa:text-xs copa:text-muted-foreground copa:bg-muted copa:rounded-md copa:px-2 copa:py-1">
          {USE_SERVER_SIDE ? "Server-side" : `${rows.length} records`}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            Live data from dataset {DATASET_ID.slice(0, 8)}…
          </CardDescription>
        </CardHeader>
        <CardContent className="copa:px-4 copa:pb-4 copa:pt-0">
          <AgGridTable
            columnDefs={columnDefs}
            {...(!USE_SERVER_SIDE ? { rowData: rows } : {})}
            height={600}
            quickFilterText={quickFilter}
            header={
              <div className="copa:px-4 copa:pt-2">
                <div className="copa:relative copa:max-w-xs">
                  <IconSearch className="copa:absolute copa:left-2.5 copa:top-2.5 copa:size-4 copa:text-muted-foreground" />
                  <Input
                    placeholder="Search payments…"
                    value={quickFilter}
                    onChange={(e) => setQuickFilter(e.target.value)}
                    className="copa:pl-9 copa:h-9"
                  />
                </div>
              </div>
            }
            gridOptions={{
              ...(USE_SERVER_SIDE
                ? { rowModelType: "serverSide" as const }
                : {}),
              pagination: true,
              paginationPageSize: 50,
              paginationPageSizeSelector: [20, 50, 100],
              ...(USE_SERVER_SIDE
                ? { cacheBlockSize: 50, maxBlocksInCache: 5 }
                : {}),
              rowSelection: { mode: "multiRow" },
              onGridReady,
              defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
                minWidth: 100,
                flex: 1,
              },
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
