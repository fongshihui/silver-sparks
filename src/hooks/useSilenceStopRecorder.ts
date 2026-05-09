import { useCallback, useRef } from "react";

type Options = {
  silenceMs?: number;
  minSpeechMs?: number;
  threshold?: number; // 0..1 normalized RMS-ish
};

export function useSilenceStopRecorder() {
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (ctxRef.current) ctxRef.current.close().catch(() => {});
    ctxRef.current = null;
  }, []);

  const attach = useCallback(
    async (
      stream: MediaStream,
      onSilence: () => void,
      opts: Options = {},
    ) => {
      cleanup();
      const silenceMs = opts.silenceMs ?? 900;
      const minSpeechMs = opts.minSpeechMs ?? 800;
      const threshold = opts.threshold ?? 0.02;

      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);
      let lastLoudAt = performance.now();
      const startedAt = performance.now();
      let hasSpoken = false;

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        // simple RMS estimate
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const now = performance.now();

        if (rms > threshold) {
          lastLoudAt = now;
          if (now - startedAt >= minSpeechMs) hasSpoken = true;
        }

        if (hasSpoken && now - lastLoudAt >= silenceMs) {
          cleanup();
          onSilence();
          return;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [cleanup],
  );

  return { attach, cleanup };
}

