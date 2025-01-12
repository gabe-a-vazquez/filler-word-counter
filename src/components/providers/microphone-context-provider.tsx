"use client";

import React, { createContext, useContext, useCallback } from "react";

export enum MicrophoneState {
  None = "none",
  Ready = "ready",
  Open = "open",
  Error = "error",
}

export enum MicrophoneEvents {
  DataAvailable = "dataavailable",
}

interface MicrophoneContextType {
  microphone: MediaRecorder | null;
  microphoneState: MicrophoneState;
  setupMicrophone: () => Promise<void>;
  startMicrophone: () => void;
}

const MicrophoneContext = createContext<MicrophoneContextType>({
  microphone: null,
  microphoneState: MicrophoneState.None,
  setupMicrophone: async () => {},
  startMicrophone: () => {},
});

export function MicrophoneProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [microphone, setMicrophone] = React.useState<MediaRecorder | null>(
    null
  );
  const [microphoneState, setMicrophoneState] = React.useState<MicrophoneState>(
    MicrophoneState.None
  );

  const setupMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      setMicrophone(mediaRecorder);
      setMicrophoneState(MicrophoneState.Ready);
    } catch (error) {
      console.error("Error setting up microphone:", error);
      setMicrophoneState(MicrophoneState.Error);
    }
  }, []);

  const startMicrophone = useCallback(() => {
    if (microphone && microphoneState === MicrophoneState.Ready) {
      microphone.start(250);
      setMicrophoneState(MicrophoneState.Open);
    }
  }, [microphone, microphoneState]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        microphoneState,
        setupMicrophone,
        startMicrophone,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
}

export const useMicrophone = () => useContext(MicrophoneContext);
