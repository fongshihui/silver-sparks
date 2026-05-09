"use client";

import { useEffect, useRef, useState } from "react";

const MAP_SCRIPT_ID = "silver-sparks-google-maps";

function loadMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(MAP_SCRIPT_ID) as
      | HTMLScriptElement
      | undefined;
    if (existing) {
      if (window.google?.maps) {
        resolve();
        return;
      }
      const onLoad = () => {
        existing.removeEventListener("load", onLoad);
        existing.removeEventListener("error", onErr);
        if (window.google?.maps) resolve();
        else reject(new Error("Google Maps did not become available."));
      };
      const onErr = () => {
        existing.removeEventListener("load", onLoad);
        existing.removeEventListener("error", onErr);
        reject(new Error("Maps script failed to load."));
      };
      existing.addEventListener("load", onLoad);
      existing.addEventListener("error", onErr);
      return;
    }
    const s = document.createElement("script");
    s.id = MAP_SCRIPT_ID;
    s.async = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Maps script failed to load."));
    document.head.appendChild(s);
  });
}

type Props = {
  apiKey: string | undefined;
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
};

export function LocationMapSection({ apiKey, lat, lng, onLocationChange }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onLocRef = useRef(onLocationChange);
  const latestPosRef = useRef({ lat, lng });
  const [[initLat, initLng]] = useState(() => [lat, lng]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    latestPosRef.current = { lat, lng };
  }, [lat, lng]);

  useEffect(() => {
    onLocRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!apiKey) return;

    const container = mapDivRef.current;
    if (!container) return;

    setLoadError(null);
    let cancelled = false;

    const teardown = () => {
      markerRef.current = null;
      mapRef.current = null;
      if (mapDivRef.current) {
        mapDivRef.current.innerHTML = "";
      }
    };

    const setup = async () => {
      try {
        await loadMaps(apiKey);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load Google Maps.");
        }
        return;
      }

      if (cancelled || !mapDivRef.current) return;

      try {
        const start = { lat: initLat, lng: initLng };
        const map = new google.maps.Map(mapDivRef.current, {
          center: start,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;

        const { lat: curLat, lng: curLng } = latestPosRef.current;
        const marker = new google.maps.Marker({
          position: { lat: curLat, lng: curLng },
          map,
          draggable: true,
          title: "Drag to your usual area",
        });
        markerRef.current = marker;

        map.setCenter({ lat: curLat, lng: curLng });

        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          if (p) onLocRef.current(p.lat(), p.lng());
        });
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          marker.setPosition(e.latLng);
          onLocRef.current(e.latLng.lat(), e.latLng.lng());
        });

        const relayout = () => {
          if (cancelled || !mapRef.current) return;
          google.maps.event.trigger(mapRef.current, "resize");
          const p = markerRef.current?.getPosition();
          if (p) mapRef.current.setCenter(p);
        };

        requestAnimationFrame(() => {
          requestAnimationFrame(relayout);
        });
        google.maps.event.addListenerOnce(map, "idle", relayout);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not start the map.");
        }
      }
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void setup();
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      teardown();
    };
  }, [apiKey, initLat, initLng]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const p = marker.getPosition();
    if (!p || Math.abs(p.lat() - lat) > 0.00008 || Math.abs(p.lng() - lng) > 0.00008) {
      marker.setPosition({ lat, lng });
      map.panTo({ lat, lng });
    }
  }, [lat, lng]);

  if (!apiKey) {
    return (
      <p className="text-sm text-[var(--foreground-muted)]">
        To drop a pin on a map, add{" "}
        <code className="rounded bg-[var(--border-subtle)] border border-[var(--border)] px-1 text-[var(--foreground)] text-xs">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </code>{" "}
        in{" "}
        <code className="rounded bg-[var(--border-subtle)] border border-[var(--border)] px-1 text-[var(--foreground)] text-xs">.env.local</code>{" "}
        and restart <code className="rounded bg-[var(--border-subtle)] border border-[var(--border)] px-1 text-[var(--foreground)] text-xs">npm run dev</code>.
        Your city is still saved.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {loadError ? (
        <div className="rounded-2xl bg-amber-50 p-4 text-base font-semibold text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900/50">
          Map could not load: {loadError}. Check that the Maps JavaScript API is enabled for
          your key and billing is active.
        </div>
      ) : null}
      <div
        ref={mapDivRef}
        className="h-56 min-h-[14rem] w-full rounded-xl border border-[var(--border)] bg-[var(--border-subtle)]"
        style={{ minHeight: "14rem" }}
      />
      <p className="text-xs font-semibold text-[var(--foreground-muted)]">
        Tap the map or drag the pin to your usual area. We use this for distances only,
        not your street address.
      </p>
    </div>
  );
}
