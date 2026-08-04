import { useCallback } from "react";
import { apiClient, getCustomerSessionId, type ApiTableRequest } from "../lib/apiClient";
import { usePollingData } from "./usePollingData";
import type { TableRequest } from "../data/tableRequests";

function fromApi(row: ApiTableRequest): TableRequest {
  return {
    id: row.id,
    tableId: row.table_id,
    reason: row.reason,
    createdAt: new Date(row.created_at).getTime(),
    resolved: row.resolved,
  };
}

export interface TableRequestsData {
  tableRequests: TableRequest[];
  callStaff: (tableId: string, reason: string) => void;
  resolveRequest: (id: string) => void;
}

// GET /api/table-requests is staff-only (see api/index.py's require_staff),
// so the customer app must not poll it — only the owner dashboard reads
// this list. `forOwner` controls that.
export function useTableRequestsData(forOwner: boolean): TableRequestsData {
  const fetcher = useCallback(() => apiClient.getTableRequests(), []);
  const rows = usePollingData(forOwner ? fetcher : async () => [] as ApiTableRequest[]);
  const tableRequests = forOwner ? (rows ?? []).map(fromApi) : [];

  const callStaff = (tableId: string, reason: string) => {
    apiClient
      .createTableRequest({ table_id: tableId, reason, customer_session_id: getCustomerSessionId() })
      .catch((err) => console.error("[MenuPilot] Failed to call staff", err));
  };

  const resolveRequest = (id: string) => {
    apiClient.resolveTableRequest(id).catch((err) => console.error("[MenuPilot] Failed to resolve request", err));
  };

  return { tableRequests, callStaff, resolveRequest };
}
