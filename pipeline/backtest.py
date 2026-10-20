"""Uji Mundur (docs/DATA.md §5): predict 2025 from 2015–2017 data only, compare with real water.

    python pipeline/backtest.py
    # needs work/subsidence_rate_until_20171231.tif (insar process, end_date 20171231),
    #       work/subsidence_rate.tif, work/elevation.tif, work/tide.json, work/water_coast_{2017,2025}.tif

Test area: land along the whole Semarang–Demak coast that was dry in 2017 (water < 20% of clear scenes)
and has Tinggi Tanah and Laju Penurunan. Truth: became permanent water by 2025 (water >= 80%).
Score: predicted Tinggi Tanah in 2025, Skenario Lanjut (lower = more likely to become water).
Passes when it beats guessing (DATA.md §5): AUC >= AUC_MIN and, below Pasang Harian, precision >= LIFT_MIN × the
share that became water anyway.
"""
import json
from pathlib import Path

import numpy as np

from compute import SLR_MM, T0, WORK, fill_gaps
from fetch_water import BOX, SAYUNG

CUTOFF = 2017
TARGET = 2025
DRY, WET = 0.2, 0.8  # water fraction thresholds for "dry land" and "permanent water"
AUC_MIN = 0.70  # 0.5 = coin toss, 1.0 = perfect ranking
LIFT_MIN = 2.0  # precision must be at least twice the base rate


def scores(predicted, truth):
    """(recall, precision): how much real new water was predicted, and how much prediction was real."""
    hit = (predicted & truth).sum()
    return (hit / truth.sum() if truth.any() else np.nan, hit / predicted.sum() if predicted.any() else np.nan)


def auc(score, truth):
    """Chance that a pixel which became water scores higher than one that did not (Mann–Whitney)."""
    ranks = np.empty(len(score))
    ranks[np.argsort(score, kind="mergesort")] = np.arange(1, len(score) + 1)
    pos, neg = truth.sum(), (~truth).sum()
    return (ranks[truth].sum() - pos * (pos + 1) / 2) / (pos * neg) if pos and neg else np.nan


def evaluate(test, truth, elev, high):
    base = truth.sum() / test.sum()
    recall, precision = scores(test & (elev < high), truth)
    return {"test_pixels": int(test.sum()), "became_water": int(truth.sum()), "base_rate": round(float(base), 3),
            "auc": round(float(auc(-elev[test], truth[test])), 3),
            "daily_recall": round(float(recall), 3), "daily_precision": round(float(precision), 3),
            "daily_lift": round(float(precision / base), 2)}


def main():
    import rasterio
    from rasterio.warp import Resampling, reproject, transform

    tide = json.loads((WORK / "tide.json").read_text())
    with rasterio.open(WORK / f"subsidence_rate_until_{CUTOFF}1231.tif") as r:
        rate_old, std_old = r.read(1), r.read(2)
        prof = r.profile
    with rasterio.open(WORK / "subsidence_rate.tif") as r:
        rate_all = r.read(1)

    def onto_grid(path, band, resampling=Resampling.average):
        out = np.full(rate_old.shape, np.nan, "float32")
        with rasterio.open(path) as src:
            reproject(rasterio.band(src, band), out, dst_transform=prof["transform"], dst_crs=prof["crs"],
                      dst_nodata=np.nan, resampling=resampling)
        return out

    elev_t0 = onto_grid(WORK / "elevation.tif", 1)
    w17, w25 = onto_grid(WORK / "water_coast_2017.tif", 1), onto_grid(WORK / "water_coast_2025.tif", 1)
    land = np.isfinite(elev_t0)
    rate_old, _, _ = fill_gaps(rate_old, std_old, land)
    rate_all, _, _ = fill_gaps(rate_all, np.zeros_like(rate_all), land)

    # DeltaDTM is from ±T0 (2021), so walk it back to 2017 with the full-period rate.
    # This leaks 2017–2021 information into the test (DATA.md §5); reported as is.
    elev_2017 = elev_t0 + rate_all / 100 * (T0 - CUTOFF)
    slr = sum(SLR_MM) / 2 / 1000
    high_2025 = tide["daily_high_tide"] + slr * (TARGET - 2026)
    elev_2025 = elev_2017 - rate_old / 100 * (TARGET - CUTOFF)

    rows, cols = np.indices(rate_old.shape)
    lon, lat = (np.array(v).reshape(rate_old.shape) for v in transform(
        prof["crs"], "EPSG:4326", *rasterio.transform.xy(prof["transform"], rows.ravel(), cols.ravel())))
    inside = lambda bx: (lon >= bx[0]) & (lon <= bx[2]) & (lat >= bx[1]) & (lat <= bx[3])
    base_test = land & np.isfinite(elev_2025) & (w17 < DRY) & np.isfinite(w25)
    result = {"cutoff": CUTOFF, "target": TARGET, "auc_min": AUC_MIN, "lift_min": LIFT_MIN}
    for name, bx in (("coast", BOX), ("sayung", SAYUNG)):
        test = base_test & inside(bx)
        result[name] = evaluate(test, test & (w25 >= WET), elev_2025, high_2025)
    c = result["coast"]
    result["passed"] = bool(c["auc"] >= AUC_MIN and c["daily_lift"] >= LIFT_MIN)
    (WORK / "backtest.json").write_text(json.dumps(result, indent=2))
    for name, label in (("coast", "Pesisir Semarang–Demak"), ("sayung", "Sayung saja")):
        r = result[name]
        print(f"{label}: {r['test_pixels']} piksel darat 2017, {r['became_water']} jadi air 2025 ({r['base_rate']:.0%} = tebakan acak)")
        print(f"  daya beda AUC {r['auc']:.2f} (minimal {AUC_MIN}) | di bawah Pasang Harian: tertangkap {r['daily_recall']:.0%}, "
              f"tepat {r['daily_precision']:.0%} = {r['daily_lift']:.1f}× acak (minimal {LIFT_MIN}×)")
    print("  LULUS" if result["passed"] else "  BELUM LULUS")


if __name__ == "__main__":
    main()
