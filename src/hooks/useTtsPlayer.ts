import { useCallback, useRef, useState } from "react";

export function useTtsPlayer() {
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stop = useCallback(() => {
    const a = audioElRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const play = useCallback(async (text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;

    // Stop any prior playback.
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }

    const res = await fetch("/api/elevenlabs/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: cleaned }),
    });
    if (!res.ok) throw new Error("TTS failed.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    // Create and fully configure before storing in ref (satisfies immutability lint).
    const a = new Audio(url);
    a.onended = () => {
      URL.revokeObjectURL(url);
      setIsPlaying(false);
    };
    a.onerror = () => {
      URL.revokeObjectURL(url);
      setIsPlaying(false);
    };
    audioElRef.current = a;

    setIsPlaying(true);
    await a.play();
  }, []);

  return { play, stop, isPlaying };
}

