import { useCallback, useState } from "react";
import { apiClient, type ApiChatMessage, type ApiChatThread } from "../lib/apiClient";
import { usePollingData } from "./usePollingData";

export interface ChatThreadsData {
  threads: ApiChatThread[];
  /** Fetches the full history for one thread on demand — the inbox list
   *  only carries the last message, not the whole conversation. */
  loadThread: (customerSessionId: string) => Promise<ApiChatMessage[]>;
  reply: (customerSessionId: string, message: string) => Promise<void>;
  sending: boolean;
}

/** Admin inbox — every customer conversation for the current store. */
export function useChatThreads(): ChatThreadsData {
  const fetcher = useCallback(() => apiClient.getChatThreads(), []);
  const threads = usePollingData(fetcher) ?? [];
  const [sending, setSending] = useState(false);

  // Stable identity across renders — StaffChatView's polling effect depends
  // on loadThread, and AppContext re-renders every consumer on every one of
  // its several unrelated 5s pollers (orders, tables, reviews, ...). An
  // unstable function here made that effect tear down and restart before
  // most in-flight requests could resolve, so `cancelled` was almost always
  // true by the time a response came back — messages just never appeared.
  const loadThread = useCallback((customerSessionId: string) => apiClient.getChatMessages(customerSessionId), []);

  const reply = useCallback(async (customerSessionId: string, message: string) => {
    setSending(true);
    try {
      await apiClient.replyToChatThread(customerSessionId, message);
    } finally {
      setSending(false);
    }
  }, []);

  return { threads, loadThread, reply, sending };
}
