import type {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { copaApi } from "@bluecopa/react";

interface CreateDatasourceOptions {
  tableId: string;
  totalCount?: number;
}

export function createServerSideDatasource({
  tableId,
  totalCount,
}: CreateDatasourceOptions): IServerSideDatasource {
  return {
    getRows: async (params: IServerSideGetRowsParams) => {
      const {
        startRow = 0,
        endRow = 50,
        sortModel,
        filterModel,
      } = params.request;
      const limit = endRow - startRow;
      const offset = startRow;

      const order_by = sortModel?.[0]?.colId;
      const order = sortModel?.[0]?.sort as "asc" | "desc" | undefined;

      const filters = filterModel
        ? Object.entries(filterModel).reduce(
            (acc, [col, filter]) => {
              acc[col] = (filter as any).filter;
              return acc;
            },
            {} as Record<string, unknown>,
          )
        : undefined;

      try {
        const response = await copaApi.inputTable.getRows(tableId, {
          limit,
          offset,
          order,
          order_by,
          filters,
        });

        const rows =
          (response as any)?.data ||
          (response as any)?.rows ||
          [];
        const rowCount =
          totalCount ?? (response as any)?.totalCount ?? undefined;

        params.success({ rowData: rows, rowCount });
      } catch (error) {
        console.error("[AG Grid Datasource] Failed:", error);
        params.fail();
      }
    },
  };
}
