import { useCallback } from "react";
import { apiClient, getCustomerSessionId, type ApiReservation } from "../lib/apiClient";
import { usePollingData } from "./usePollingData";

export interface ReservationsData {
  reservations: ApiReservation[];
  createReservation: (tableId: string, tableStatus: string, partySize: number, mode: "web" | "store") => Promise<void>;
  updateReservationStatus: (id: string, status: "accepted" | "cancelled") => void;
}

// GET /api/reservations is staff-only, so only the owner dashboard polls
// the full list (see api/index.py's require_staff on that route).
export function useReservationsData(forOwner: boolean): ReservationsData {
  const fetcher = useCallback(() => (forOwner ? apiClient.getReservations() : Promise.resolve([])), [forOwner]);
  const rows = usePollingData(fetcher);
  const reservations = rows ?? [];

  // The server recomputes the real status from the table's current state —
  // this guess only satisfies the request schema, mirroring Wexit's own
  // frontend convention (see api/index.py's create_reservation()).
  const createReservation = async (tableId: string, tableStatus: string, partySize: number, mode: "web" | "store") => {
    await apiClient.createReservation({
      table_id: tableId,
      status: tableStatus === "available" ? "reserved" : "waiting",
      customer_session_id: getCustomerSessionId(),
      mode,
      party_size: partySize,
    });
  };

  const updateReservationStatus = (id: string, status: "accepted" | "cancelled") => {
    apiClient
      .updateReservationStatus(id, status)
      .catch((err) => console.error("[MenuPilot] Failed to update reservation", err));
  };

  return { reservations, createReservation, updateReservationStatus };
}
