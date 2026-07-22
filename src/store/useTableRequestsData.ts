import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { usePersistentState } from "./usePersistentState";
import type { TableRequest } from "../data/tableRequests";

interface RequestRow {
  id: string;
  table_number: number;
  reason: string;
  created_at: string;
  resolved: boolean;
}

function fromRow(row: RequestRow): TableRequest {
  return {
    id: row.id,
    tableNumber: row.table_number,
    reason: row.reason,
    createdAt: new Date(row.created_at).getTime(),
    resolved: row.resolved,
  };
}

export interface TableRequestsData {
  tableRequests: TableRequest[];
  callStaff: (tableNumber: number, reason: string) => void;
  resolveRequest: (id: string) => void;
}

let localIdCounter = 0;

export function useTableRequestsData(restaurantId: string | null): TableRequestsData {
  const [local, setLocal] = usePersistentState<TableRequest[]>("fb_table_requests", []);
  const [cloud, setCloud] = useState<TableRequest[]>([]);
  const usingCloud = isSupabaseConfigured && restaurantId != null;

  useEffect(() => {
    if (!usingCloud || !supabase) return;
    let cancelled = false;

    const refresh = async () => {
      const { data } = await supabase!
        .from("table_requests")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });
      if (!cancelled) setCloud((data ?? []).map(fromRow));
    };

    refresh();
    const channel = supabase
      .channel(`table-requests-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_requests", filter: `restaurant_id=eq.${restaurantId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, [usingCloud, restaurantId]);

  const tableRequests = usingCloud ? cloud : local;

  const callStaff = (tableNumber: number, reason: string) => {
    if (usingCloud && supabase && restaurantId) {
      supabase.from("table_requests").insert({ restaurant_id: restaurantId, table_number: tableNumber, reason }).then();
    } else {
      const request: TableRequest = {
        id: `tr${Date.now()}_${localIdCounter++}`,
        tableNumber,
        reason,
        createdAt: Date.now(),
        resolved: false,
      };
      setLocal((prev) => [request, ...prev]);
    }
  };

  const resolveRequest = (id: string) => {
    if (usingCloud && supabase) {
      supabase.from("table_requests").update({ resolved: true }).eq("id", id).then();
    } else {
      setLocal((prev) => prev.map((r) => (r.id === id ? { ...r, resolved: true } : r)));
    }
  };

  return { tableRequests, callStaff, resolveRequest };
}
