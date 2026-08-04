import { useCallback } from "react";
import { apiClient, type ApiTable } from "../lib/apiClient";
import { usePollingData } from "./usePollingData";

export interface TablesData {
  tables: ApiTable[];
  saveLayout: (tables: ApiTable[]) => Promise<ApiTable[]>;
}

export function useTablesData(): TablesData {
  const fetcher = useCallback(() => apiClient.getTables(), []);
  const rows = usePollingData(fetcher);
  const tables = rows ?? [];

  const saveLayout = async (next: ApiTable[]) => {
    const res = await apiClient.updateTables(next);
    return res.tables;
  };

  return { tables, saveLayout };
}
