"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface PlayerSyncContextType {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  activeSegmentId: number | null;
  seekTo: (timeSeconds: number) => void;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  setDuration: React.Dispatch<React.SetStateAction<number>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveSegmentId: (id: number | null) => void;
  onSeekRequested?: (timeSeconds: number) => void;
  registerSeekHandler: (handler: (timeSeconds: number) => void) => void;
}

const PlayerSyncContext = createContext<PlayerSyncContextType | undefined>(undefined);

export function PlayerSyncProvider({ children }: { children: ReactNode }) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  const [seekHandler, setSeekHandler] = useState<((time: number) => void) | null>(null);

  const registerSeekHandler = useCallback((handler: (time: number) => void) => {
    setSeekHandler(() => handler);
  }, []);

  const seekTo = useCallback(
    (timeSeconds: number) => {
      setCurrentTime(timeSeconds);
      if (seekHandler) {
        seekHandler(timeSeconds);
      }
    },
    [seekHandler]
  );

  return (
    <PlayerSyncContext.Provider
      value={{
        currentTime,
        duration,
        isPlaying,
        activeSegmentId,
        seekTo,
        setCurrentTime,
        setDuration,
        setIsPlaying,
        setActiveSegmentId,
        registerSeekHandler,
      }}
    >
      {children}
    </PlayerSyncContext.Provider>
  );
}

export function usePlayerSync() {
  const context = useContext(PlayerSyncContext);
  if (!context) {
    throw new Error("usePlayerSync must be used within a PlayerSyncProvider");
  }
  return context;
}
