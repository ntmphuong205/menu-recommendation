import { useCallback } from "react";
import { apiClient, type ApiStore } from "../lib/apiClient";
import { usePollingData } from "./usePollingData";

export interface StoreUpdatePayload {
  name: string;
  hours: string;
  description: string;
  menu_categories: string[];
  bank_bin?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  bank_qr_image?: string | null;
  opening_time?: string;
  closing_time?: string;
  phone?: string;
  wifi_name?: string;
  wifi_password?: string;
}

export interface StoreData {
  store: ApiStore | null;
  /** Null until the first poll resolves — distinct from an empty list, so
   *  StoreSettingsView can tell "not loaded yet" apart from "genuinely no
   *  keywords" when deciding whether to seed its local edit state. */
  keywords: string[] | null;
  updateStore: (payload: StoreUpdatePayload) => Promise<ApiStore>;
  updateKeywords: (keywords: string[]) => Promise<string[]>;
}

// Store info and AI recommendation keywords change rarely — poll slower
// than the 5s default used for live order/table data.
const STORE_POLL_MS = 20000;

export function useStoreData(): StoreData {
  const storeFetcher = useCallback(() => apiClient.getStore(), []);
  const store = usePollingData(storeFetcher, STORE_POLL_MS);

  const keywordsFetcher = useCallback(() => apiClient.getKeywords().then((r) => r.keywords), []);
  const keywords = usePollingData(keywordsFetcher, STORE_POLL_MS);

  const updateStore = async (payload: StoreUpdatePayload) => {
    const res = await apiClient.updateStore(payload);
    return res.store;
  };

  const updateKeywords = async (next: string[]) => {
    const res = await apiClient.updateKeywords(next);
    return res.keywords;
  };

  return { store, keywords, updateStore, updateKeywords };
}
