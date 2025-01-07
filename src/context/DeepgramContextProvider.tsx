"use client";

import React, { createContext, useContext, useCallback } from "react";

export enum LiveConnectionState {
  NONE = "none",
  CONNECTING = "connecting",
  OPEN = "open",
  CLOSING = "closing",
  CLOSED = "closed",
}

export enum LiveTranscriptionEvents {
  Transcript = "transcript",
  Error = "error",
  Close = "close",
  Open = "open",
}

export interface LiveTranscriptionEvent {
  channel: {
    alternatives: Array<{
      transcript: string;
    }>;
  };
  is_final: boolean;
  speech_final: boolean;
}

interface DeepgramContextType {
  connection: WebSocket | null;
  connectionState: LiveConnectionState;
  connectToDeepgram: (options: any) => void;
}

const DeepgramContext = createContext<DeepgramContextType>({
  connection: null,
  connectionState: LiveConnectionState.NONE,
  connectToDeepgram: () => {},
});

export function DeepgramProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = React.useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] =
    React.useState<LiveConnectionState>(LiveConnectionState.NONE);

  const connectToDeepgram = useCallback((options: any) => {
    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (!apiKey) {
      console.error("Deepgram API key not found");
      return;
    }

    const queryString = new URLSearchParams({
      model: options.model || "nova-2",
      interim_results: String(options.interim_results || true),
      smart_format: String(options.smart_format || true),
      filler_words: String(options.filler_words || true),
      utterance_end_ms: String(options.utterance_end_ms || 3000),
    }).toString();

    const socket = new WebSocket(
      `wss://api.deepgram.com/v1/listen?${queryString}`,
      ["token", apiKey]
    );

    socket.onopen = () => {
      setConnectionState(LiveConnectionState.OPEN);
      console.log("WebSocket connection established");
    };

    socket.onclose = () => {
      setConnectionState(LiveConnectionState.CLOSED);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setConnection(socket);
    setConnectionState(LiveConnectionState.CONNECTING);
  }, []);

  return (
    <DeepgramContext.Provider
      value={{
        connection,
        connectionState,
        connectToDeepgram,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
}

export const useDeepgram = () => useContext(DeepgramContext);
