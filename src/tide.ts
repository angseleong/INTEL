// Banner pasang minggu ini: the highest predicted high water in the next 7 days (public/data/tide.json,
// harmonic prediction from the IOC Semarang gauge, pipeline/fetch_tide.py).

type Tide = { updated: string; station: string; highs: [number, number][] };

export async function showTideBanner(el: HTMLElement, highestTide: number) {
  const tide = (await fetch("/data/tide.json").then((r) => r.json())) as Tide;
  const now = Date.now() / 1000;
  const week = tide.highs.filter(([t]) => t >= now && t < now + 7 * 86400);
  if (!week.length) return; // prediction ran out: better no banner than an old one
  const [t, h] = week.reduce((a, b) => (b[1] > a[1] ? b : a));
  const when = new Date(t * 1000).toLocaleString("id-ID", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  });
  const m = (x: number) => `${x.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m`;
  el.innerHTML = `<span class="label">Pasang tinggi minggu ini</span> ${when} WIB, ±${m(h)} di atas muka laut rata-rata
    <span class="muted">(pasang tertinggi setahun ${m(highestTide)}). Perkiraan dari stasiun ${tide.station}.</span>`;
  el.hidden = false;
}
