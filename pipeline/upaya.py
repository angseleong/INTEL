"""Numbers for the Apa yang Bisa Dilakukan page (docs/USERFLOW.md §1.4): python pipeline/upaya.py  # -> public/data/upaya.json

- Laju Penurunan measured near each Kartu Upaya site, 2015–2017 and the whole record, from Sentinel-1.
- Skenario Lanjut vs Henti over the whole Wilayah Cakupan.
Only measured pixels (no gap filling): a Kartu Upaya speaks about one place.
"""
import json
from datetime import date
from pathlib import Path

import numpy as np

from compute import ALREADY, NEVER, WORK

OUT = Path(__file__).parent.parent / "public" / "data" / "upaya.json"
SITES = {  # id: (lon, lat, radius m). Coordinates from OpenStreetMap / Nominatim
    "tambaklorok": (110.4323, -6.9507, 750),
    "banger": (110.4379, -6.9579, 1000),
    "timbulsloko": (110.5182, -6.9135, 1000),
}
MIN_PIXELS = 10  # fewer measured pixels than this: "belum bisa diukur"


def near(path, lon, lat, radius):
    """Median and count of measured Laju Penurunan (cm/tahun) within radius metres of a point."""
    import rasterio
    from rasterio.warp import transform

    with rasterio.open(path) as r:
        rate, t, crs = r.read(1), r.transform, r.crs
    (x,), (y,) = transform("EPSG:4326", crs, [lon], [lat])
    rows, cols = np.indices(rate.shape)
    px, py = t.c + (cols + 0.5) * t.a, t.f + (rows + 0.5) * t.e
    m = ((px - x) ** 2 + (py - y) ** 2 <= radius ** 2) & np.isfinite(rate)
    return (round(float(np.median(rate[m])), 1) if m.sum() >= MIN_PIXELS else None), int(m.sum())


def scenarios():
    """Area below Pasang Tertinggi by 2050 per Skenario, and the share of land reaching it 2027–2050 under Lanjut
    that Henti keeps above it until after 2050."""
    import rasterio

    with rasterio.open(WORK / "rob.tif") as r:
        b = {n: r.read(i + 1) for i, n in enumerate(r.descriptions)}
        ha = abs(r.transform.a * r.transform.e) / 1e4
    cont, stop = b["robYear_continue"], b["robYear_stop"]
    hit = (cont > ALREADY) & (cont < NEVER)
    saved = hit & (stop == NEVER)
    return {"haLanjut2050": round(float(((cont != NEVER) & (cont != -1)).sum() * ha)),
            "haHenti2050": round(float(((stop != NEVER) & (stop != -1)).sum() * ha)),
            "haAlready": round(float((cont == ALREADY).sum() * ha)),
            "persenSelamatSampai2050": round(100 * saved.sum() / hit.sum())}


def main():
    sites = {}
    for key, (lon, lat, radius) in SITES.items():
        early, n_early = near(WORK / "subsidence_rate_until_20171231.tif", lon, lat, radius)
        full, n_full = near(WORK / "subsidence_rate.tif", lon, lat, radius)
        sites[key] = {"lon": lon, "lat": lat, "radiusM": radius, "laju2015_2017": early, "lajuSemua": full,
                      "titik": min(n_early, n_full)}
    out = {"updated": date.today().isoformat(), "sites": sites, "scenario": scenarios()}
    OUT.write_text(json.dumps(out, indent=2))
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
