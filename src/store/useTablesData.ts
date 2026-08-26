import { useCallback } from "react";
import { apiClient, type ApiTable } from "../lib/apiClient";
import { usePollingData } from "./usePollingData";

export interface TablesData {
  tables: ApiTable[];
  saveLayout: (tables: ApiTable[]) => Promise<ApiTable[]>;
  /** Staff marks a table paid up and free — flips it back to available and
   *  starts a fresh session boundary so the next party doesn't see the
   *  last group's orders (see CartScreen's MyOrdersSection). */
  clearTable: (tableCode: string) => Promise<ApiTable>;
}

export function useTablesData(): TablesData {
  const fetcher = useCallback(() => apiClient.getTables(), []);
  const rows = usePollingData(fetcher);
  const tables = rows ?? [];

  const saveLayout = async (next: ApiTable[]) => {
    const res = await apiClient.updateTables(next);
    return res.tables;
  };

  const clearTable = async (tableCode: string) => {
    const res = await apiClient.clearTable(tableCode);
    return res.table;
  };

  return { tables, saveLayout, clearTable };
}
