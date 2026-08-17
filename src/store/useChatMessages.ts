import { useCallback, useState } from "react";
import { apiClient, type ApiChatMessage } from "../lib/apiClient";
import { usePollingData } from "./usePollingData";

export interface ChatMessagesData {
  messages: ApiChatMessage[];
  sendMessage: (message: string) => Promise<void>;
  sending: boolean;
}

/** Customer's own conversation with restaurant staff — one thread per
 *  customer_session_id, same id already used for orders/reviews. */
export function useChatMessages(customerSessionId: string, tableId: string | null): ChatMessagesData {
  const fetcher = useCallback(() => apiClient.getChatMessages(customerSessionId), [customerSessionId]);
  const messages = usePollingData(fetcher) ?? [];
  const [sending, setSending] = useState(false);

  const sendMessage = async (message: string) => {
    setSending(true);
    try {
      await apiClient.sendChatMessage({ customer_session_id: customerSessionId, table_id: tableId, message });
    } finally {
      setSending(false);
    }
  };

  return { messages, sendMessage, sending };
}
