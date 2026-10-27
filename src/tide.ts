// Banner pasang minggu ini: the highest predicted high water in the next 7 days (public/data/tide.json,
// harmonic prediction from the IOC Semarang gauge, pipeline/fetch_tide.py).

type Tide = { updated: string; station: string; highs: [number, number][] };
export type WeekHigh = { when: string; height: number; station: string };

/** null when the prediction ran out: better no banner than an old one. */
export async function weekHigh(): Promise<WeekHigh | null> {
  const tide = (await fetch("/data/tide.json").then((r) => r.json())) as Tide;
  const now = Date.now() / 1000;
  const week = tide.highs.filter(([t]) => t >= now && t < now + 7 * 86400);
  if (!week.length) return null;
  const [t, height] = week.reduce((a, b) => (b[1] > a[1] ? b : a));
  const when = new Date(t * 1000).toLocaleString("id-ID", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  });
  return { when, height, station: tide.station };
}
