"""Tahun Rob and Tahun Terendam for every point (docs/DATA.md §2–3).

    python pipeline/compute.py   # work/elevation.tif + work/subsidence_rate.tif + work/tide.json -> work/rob.tif

Masa Perkiraan only. Masa Terukur (measured cumulative subsidence per year) is added with the InSAR time series.
"""
import json
from pathlib import Path

import numpy as np

T0 = 2021             # Tinggi Tanah reference year of DeltaDTM, from 1,604 dated ICESat-2 points (DATA.md §2.1)
DEM_SIGMA = 0.50      # m, DeltaDTM mean absolute error in Indonesia (DATA.md §1)
SLR_MM = (2.4, 4.3)   # mm/tahun, Kenaikan Muka Laut range (BRIN)
STOP_FROM = 2027      # Skenario Henti: groundwater pumping stops this year
HENTI_TAHUN = 10      # ... and subsidence slows linearly to zero over this many years (Tokyo, DATA.md §2.2)
YEARS = np.arange(2026, 2051)
RENTANG_MAKS = 10     # Rentang Tahun wider than this reads "belum bisa diperkirakan" (DATA.md §3.3)
ALREADY = 0           # already below the tide in the first year
NEVER = 9999          # not below the tide before 2050

WORK = Path(__file__).parent / "work"


def subsided(rate, t, scenario):
    """Metres the ground has dropped between T0 and year t. rate in m/tahun, positive = down."""
    t = np.asarray(t, dtype="float64")
    full = rate * (np.minimum(t, STOP_FROM) - T0) if scenario == "stop" else rate * (t - T0)
    if scenario == "continue":
        return full
    x = np.clip(t - STOP_FROM, 0, HENTI_TAHUN)
    return full + rate * (x - x ** 2 / (2 * HENTI_TAHUN))  # area under a rate that ramps down to 0


def first_year_below(elev0, rate, tide0, slr, scenario):
    """First year in YEARS where Tinggi Tanah < tide, as ALREADY / a year / NEVER.

    elev0: m above MSL in T0. rate: m/tahun. tide0: m above MSL in 2026. slr: m/tahun.
    """
    elev0, rate = np.asarray(elev0, "float64"), np.asarray(rate, "float64")
    t = YEARS.reshape((-1,) + (1,) * elev0.ndim)
    below = elev0 - subsided(rate, t, scenario) < tide0 + slr * (t - YEARS[0])
    year = np.where(below.any(axis=0), YEARS[below.argmax(axis=0)], NEVER)
    return np.where(below[0], ALREADY, year)


def year_range(elev0, rate, rate_std, tide0, scenario):
    """(earliest, middle, latest) Tahun Rob/Terendam for one tide level (DATA.md §3.2)."""
    lo, hi = (s / 1000 for s in SLR_MM)
    return (first_year_below(elev0 - DEM_SIGMA, rate + rate_std, tide0, hi, scenario),
            first_year_below(elev0, rate, tide0, (lo + hi) / 2, scenario),
            first_year_below(elev0 + DEM_SIGMA, rate - rate_std, tide0, lo, scenario))


def too_uncertain(earliest, latest):
    """True where the Rentang Tahun is wider than RENTANG_MAKS."""
    a = np.where(earliest == ALREADY, YEARS[0], earliest)
    b = np.where(latest == NEVER, YEARS[-1] + 1, np.where(latest == ALREADY, YEARS[0], latest))
    return (b - a > RENTANG_MAKS) & ~((earliest == NEVER) & (latest == NEVER))


def main():
    import rasterio
    from rasterio.warp import Resampling, reproject

    tide = json.loads((WORK / "tide.json").read_text())
    with rasterio.open(WORK / "subsidence_rate.tif") as r:
        rate_cm, std_cm = r.read(1), r.read(2)
        prof = r.profile
    elev = np.full(rate_cm.shape, np.nan, "float32")
    with rasterio.open(WORK / "elevation.tif") as d:  # 30 m -> InSAR grid, averaged
        reproject(rasterio.band(d, 1), elev, dst_transform=prof["transform"], dst_crs=prof["crs"],
                  dst_nodata=np.nan, resampling=Resampling.average)
    ok = np.isfinite(elev) & np.isfinite(rate_cm)
    bands, names = [], []
    for scenario in ("continue", "stop"):
        for key, level in (("rob", tide["highest_tide"]), ("flooded", tide["daily_high_tide"])):
            for part, years in zip(("Min", "", "Max"), year_range(elev, rate_cm / 100, std_cm / 100, level, scenario)):
                bands.append(np.where(ok, years, -1).astype("int16"))
                names.append(f"{key}Year{part}_{scenario}")
    with rasterio.open(WORK / "rob.tif", "w", **(prof | {"count": len(bands), "dtype": "int16", "nodata": -1})) as dst:
        dst.write(np.stack(bands))
        for i, n in enumerate(names, 1):
            dst.set_band_description(i, n)
    print(f"{WORK / 'rob.tif'}: {len(bands)} bands, {ok.sum()} points")


if __name__ == "__main__":
    main()
