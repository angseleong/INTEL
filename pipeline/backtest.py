"""Uji Mundur Sayung (docs/DATA.md §5): predict 2025 from 2015–2017 data only, compare with real water.

    python pipeline/backtest.py
    # needs work/subsidence_rate_until_20171231.tif (insar process, end_date 20171231),
    #       work/subsidence_rate.tif, work/elevation.tif, work/tide.json, work/water_2017.tif, work/water_2025.tif

Test area: land in Sayung that was dry in 2017 (water < 20% of clear scenes) and has Tinggi Tanah and
Laju Penurunan. Truth: became permanent water by 2025 (water >= 80% of clear scenes).
Prediction: below Surut Harian in 2025 (Tahun Hilang ke Laut <= 2025), Skenario Lanjut, middle estimate.
"""
import json
from pathlib import Path

import numpy as np

from compute import SLR_MM, T0, WORK, fill_gaps
from fetch_water import BOX

CUTOFF = 2017
TARGET = 2025
DRY, WET = 0.2, 0.8  # water fraction thresholds for "dry land" and "permanent water"
UJI_MINIMAL = 0.70   # share of really-flooded pixels the prediction must catch (DATA.md §5)


def scores(predicted, truth):
    """(recall, precision): how much real new water was predicted, and how much prediction was real."""
    hit = (predicted & truth).sum()
    return (hit / truth.sum() if truth.any() else np.nan, hit / predicted.sum() if predicted.any() else np.nan)


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
    w17, w25 = onto_grid(WORK / "water_2017.tif", 1), onto_grid(WORK / "water_2025.tif", 1)
    land = np.isfinite(elev_t0)
    rate_old, _, _ = fill_gaps(rate_old, std_old, land)
    rate_all, _, _ = fill_gaps(rate_all, np.zeros_like(rate_all), land)

    # DeltaDTM is from ±T0 (2021), so walk it back to 2017 with the full-period rate.
    # This leaks 2017–2021 information into the test (DATA.md §5); reported as is.
    elev_2017 = elev_t0 + rate_all / 100 * (T0 - CUTOFF)
    slr = sum(SLR_MM) / 2 / 1000
    low_2025 = tide["daily_low_tide"] + slr * (TARGET - 2026)
    high_2025 = tide["daily_high_tide"] + slr * (TARGET - 2026)
    elev_2025 = elev_2017 - rate_old / 100 * (TARGET - CUTOFF)

    rows, cols = np.indices(rate_old.shape)
    lon, lat = (np.array(v).reshape(rate_old.shape) for v in transform(
        prof["crs"], "EPSG:4326", *rasterio.transform.xy(prof["transform"], rows.ravel(), cols.ravel())))
    in_box = (lon >= BOX[0]) & (lon <= BOX[2]) & (lat >= BOX[1]) & (lat <= BOX[3])
    test = in_box & land & np.isfinite(elev_2025) & (w17 < DRY) & np.isfinite(w25)
    truth = test & (w25 >= WET)

    recall, precision = scores(test & (elev_2025 < low_2025), truth)
    recall_f, precision_f = scores(test & (elev_2025 < high_2025), truth)
    result = {
        "cutoff": CUTOFF, "target": TARGET, "test_pixels": int(test.sum()), "became_water": int(truth.sum()),
        "lost_recall": round(float(recall), 3), "lost_precision": round(float(precision), 3),
        "flooded_recall": round(float(recall_f), 3), "flooded_precision": round(float(precision_f), 3),
        "minimum": UJI_MINIMAL, "passed": bool(recall >= UJI_MINIMAL),
    }
    (WORK / "backtest.json").write_text(json.dumps(result, indent=2))
    print(f"Uji Mundur Sayung: {result['test_pixels']} piksel darat 2017, {result['became_water']} jadi air permanen 2025")
    print(f"  Hilang ke Laut (< Surut Harian): tertangkap {recall:.0%} (minimal {UJI_MINIMAL:.0%}), tepat {precision:.0%}")
    print(f"  Terendam (< Pasang Harian):      tertangkap {recall_f:.0%}, tepat {precision_f:.0%}")
    print("  LULUS" if result["passed"] else "  BELUM LULUS")


if __name__ == "__main__":
    main()
