// Pencarian alamat: Nominatim (OpenStreetMap). Only on submit, since its usage policy forbids
// search-as-you-type and allows at most 1 request per second.

export type Place = { name: string; lon: number; lat: number };

export async function searchPlaces(q: string, area: readonly number[]): Promise<Place[]> {
  const params = new URLSearchParams({
    q, format: "jsonv2", countrycodes: "id", viewbox: area.join(","), bounded: "1", limit: "5", "accept-language": "id",
  });
  const r = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!r.ok) throw new Error(`Nominatim ${r.status}`);
  const rows = (await r.json()) as { display_name: string; lon: string; lat: string }[];
  return rows.map((p) => ({ name: p.display_name, lon: Number(p.lon), lat: Number(p.lat) }));
}
