"use client";

import React, { createContext, useContext, useCallback } from "react";
import { getAuth } from "firebase/auth";

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

  const connectToDeepgram = useCallback(async (options: any) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("User must be logged in to use this feature");
      }

      const token = await currentUser.getIdToken();

      // Get temporary token from our API
      const response = await fetch("/api/deepgram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get WebSocket credentials");
      }

      if (!data.token || !data.queryString) {
        throw new Error("Invalid response format from server");
      }

      // Create WebSocket connection using temporary token
      const socket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?${data.queryString}`,
        ["token", data.token]
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
    } catch (error) {
      console.error("Failed to connect to Deepgram:", error);
      setConnectionState(LiveConnectionState.CLOSED);
    }
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
