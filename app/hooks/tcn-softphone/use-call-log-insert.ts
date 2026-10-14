import { useCallback } from "react";
import { copaApi, copaGetConfig } from "@bluecopa/react";

/**
 * Inserts one row into the call-log Input Table V2 and returns the created row
 * (with its generated id). Keys are the table's own column names. Returns null
 * when the table or the solution id is not configured.
 */
export function useCallLogInsert(tableName: string | undefined) {
  const insert = useCallback(
    async (row: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
      const solutionId = (copaGetConfig() as { solutionId?: string })?.solutionId;
      if (!tableName || !solutionId) return null;
      const res = await (copaApi as any).apiClient.post(
        `/input-table-v2/${solutionId}/rows/${tableName}`,
        row,
        { headers: { Prefer: "return=representation" } },
      );
      return (Array.isArray(res?.data) ? res.data[0] : (res?.data?.data ?? res?.data)) ?? null;
    },
    [tableName],
  );
  return { insert };
}
