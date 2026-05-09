/** Haversine distance in kilometres between two WGS84 points. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Default map centre (Singapore) when the member has not set coordinates yet. */
export const DEFAULT_MAP_CENTER = { lat: 1.3521, lng: 103.8198 };

type GeocodePoint = { lat: number; lng: number };

export async function geocodeCityToLatLng(
  cityOrArea: string,
  apiKey: string,
): Promise<GeocodePoint | null> {
  const q = cityOrArea.trim();
  if (!q) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", q);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = (await res.json()) as {
    status?: string;
    results?: Array<{ geometry?: { location?: GeocodePoint } }>;
  };
  if (json.status !== "OK") return null;
  const location = json.results?.[0]?.geometry?.location;
  if (!location) return null;
  return { lat: location.lat, lng: location.lng };
}
