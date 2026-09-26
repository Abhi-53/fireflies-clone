"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Pause, Play } from "lucide-react";
import { usePlayerSync } from "@/context/PlayerSyncContext";
import { formatSecondsToTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/Button";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function barsFromId(id: number) {
  const out: number[] = [];
  let seed = id * 1103515245 + 12345;
  for (let i = 0; i < 64; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    out.push(18 + (seed % 70));
  }
  return out;
}

export function MediaPlayer({
  meetingId,
  mediaUrl,
  durationSeconds,
  stickyMobile,
}: {
  meetingId: number;
  mediaUrl?: string | null;
  durationSeconds: number;
  stickyMobile?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const isDraggingRef = useRef(false);
  const waveformRef = useRef<HTMLDivElement>(null);

  const {
    currentTime,
    duration,
    isPlaying,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    registerSeekHandler,
  } = usePlayerSync();

  const [speed, setSpeed] = useState(1);
  const [failed, setFailed] = useState(false);
  const src = resolveMediaUrl(mediaUrl);
  const bars = useMemo(() => barsFromId(meetingId), [meetingId]);
  const total = duration || durationSeconds || 1;
  const simulated = !src || failed;
  const timeRef = useRef(currentTime);
  timeRef.current = currentTime;

  // Reset failed state if mediaUrl or meetingId changes
  useEffect(() => {
    setFailed(false);
  }, [src, meetingId]);

  useEffect(() => {
    if (durationSeconds && (!duration || duration === 0)) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds, duration, setDuration]);

  // Ensure volume and unmuted on mount and when audio ref changes
  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.muted = false;
      el.volume = 1;
      el.playbackRate = speed;
    }
  }, [speed, src]);

  const seekRatio = useCallback((ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    const t = clamped * total;
    const el = audioRef.current;
    if (el && !failed && src) {
      try {
        el.currentTime = t;
      } catch {
        // ignore
      }
    }
    setCurrentTime(t);
  }, [total, failed, src, setCurrentTime]);

  useEffect(() => {
    registerSeekHandler((t) => {
      const el = audioRef.current;
      if (el && !failed && src) {
        try {
          el.currentTime = t;
          el.muted = false;
          el.volume = 1;
          const playPromise = el.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("Audio play prevented or failed:", err);
            });
          }
        } catch (err) {
          console.warn("Seek error:", err);
        }
      }
      setCurrentTime(t);
      setIsPlaying(true);
    });
  }, [registerSeekHandler, setCurrentTime, setIsPlaying, failed, src]);

  useEffect(() => {
    if (!isPlaying || !simulated) return;
    const id = window.setInterval(() => {
      const next = timeRef.current + 0.25 * speed;
      if (next >= total) {
        setIsPlaying(false);
        setCurrentTime(total);
        return;
      }
      setCurrentTime(next);
    }, 250);
    return () => window.clearInterval(id);
  }, [isPlaying, simulated, speed, total, setCurrentTime, setIsPlaying]);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el || failed || !src) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (el.paused) {
      try {
        el.muted = false;
        el.volume = 1;
        el.playbackRate = speed;
        await el.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Audio playback failed, falling back to simulated playback:", err);
        setFailed(true);
        setIsPlaying(true);
      }
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0) {
      seekRatio((e.clientX - rect.left) / rect.width);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0) {
      seekRatio((e.clientX - rect.left) / rect.width);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className={`player-bar ${stickyMobile ? "is-mobile-sticky" : ""}`}>
      {src && !failed ? (
        <audio
          ref={audioRef}
          src={src}
          preload="auto"
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => {
            if (!isDraggingRef.current) {
              setCurrentTime(e.currentTarget.currentTime);
            }
          }}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) {
              setDuration(d);
            } else if (durationSeconds) {
              setDuration(durationSeconds);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(total);
          }}
          onError={(e) => {
            console.warn("Audio error encountered:", e);
            setFailed(true);
          }}
        />
      ) : null}
      <div className="player-bar__row">
        <Button variant="icon" aria-label={isPlaying ? "Pause" : "Play"} onClick={toggle}>
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <span className="time-label">{formatSecondsToTime(currentTime)}</span>
        <div
          ref={waveformRef}
          className="waveform"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={currentTime}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: "none", cursor: "pointer", userSelect: "none" }}
        >
          {bars.map((h, i) => {
            const played = i / bars.length < currentTime / total;
            return <span key={i} className={played ? "is-played" : undefined} style={{ height: `${h}%` }} />;
          })}
        </div>
        <span className="time-label">{formatSecondsToTime(total)}</span>
        <select
          className="mf-input mf-input--compact"
          style={{ width: 84 }}
          value={String(speed)}
          onChange={(e) => {
            const newSpeed = Number(e.target.value);
            setSpeed(newSpeed);
            if (audioRef.current) {
              audioRef.current.playbackRate = newSpeed;
            }
          }}
          aria-label="Playback speed"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
      </div>
      {simulated ? (
        <span className="muted">Waveform scrubber — timestamps still seek the transcript highlight.</span>
      ) : null}
    </div>
  );
}
