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

  const loadThread = (customerSessionId: string) => apiClient.getChatMessages(customerSessionId);

  const reply = async (customerSessionId: string, message: string) => {
    setSending(true);
    try {
      await apiClient.replyToChatThread(customerSessionId, message);
    } finally {
      setSending(false);
    }
  };

  return { threads, loadThread, reply, sending };
}
