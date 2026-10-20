"""work/rob.tif -> files the web map reads (docs/ARCHITECTURE.md §4).

    python pipeline/export.py   # -> public/data/below-tide-{rob,daily}.geojson, water-2025.geojson, points.json,
                                #    kelurahan.json, ranking.csv, constellation.json, meta.json

ponytail: plain GeoJSON while the map covers only Demak–Semarang (a few MB). Switch to PMTiles once Pantura is in.
"""
import csv
import json
from datetime import date
from itertools import product
from pathlib import Path

import numpy as np

from compute import ALREADY, NEVER, RENTANG_MAKS, WORK, YEARS, fill_gaps, load_inputs

OUT = Path(__file__).parent.parent / "public" / "data"
SCENARIOS = ("continue", "stop")
LEVELS = ("rob", "daily")  # below Pasang Tertinggi, below Pasang Harian
SIMPLIFY_M = 60  # ¾ of an InSAR pixel; keeps the coastline shape, drops stair-steps
MIN_POINTS = 20  # a Kelurahan needs this many points (±13 ha) in the Wilayah Cakupan to be ranked
CONSTELLATION = 6000  # measured points drawn in the Tentang hero


def below_tide_polygons(rob, transform, crs):
    """One feature per level per Skenario per year: every point already below that tide level in that year."""
    from rasterio.features import shapes
    from rasterio.warp import transform_geom
    from shapely.geometry import mapping, shape
    from shapely.ops import unary_union

    features = []
    for level, scenario, year in product(LEVELS, SCENARIOS, YEARS):
        mid = rob[f"{level}Year_{scenario}"]
        mask = ((mid == ALREADY) | ((mid >= YEARS[0]) & (mid <= year) & (mid != NEVER))).astype("uint8")
        parts = [shape(g) for g, v in shapes(mask, mask=mask.astype(bool), transform=transform) if v == 1]
        if not parts:
            continue
        geom = unary_union(parts).simplify(SIMPLIFY_M)
        features.append({"type": "Feature", "properties": {"level": level, "year": int(year), "scenario": scenario},
                         "geometry": transform_geom(crs, "EPSG:4326", mapping(geom), precision=4)})  # 4 decimals ≈ 11 m
    return features


def kelurahan_grid(shape, transform, crs):
    """(list of Kelurahan, index into it per pixel or -1). A pixel belongs to the Kelurahan holding its centre."""
    import geopandas as gpd
    from rasterio.features import rasterize

    kel = gpd.read_file(WORK / "kelurahan.geojson")
    grid = rasterize(zip(kel.to_crs(crs).geometry, range(len(kel))), out_shape=shape, transform=transform, fill=-1, dtype="int32")
    return kel, grid


def ranking(rob, rate, kel, grid, pixel_ha, to_lonlat=lambda r, c: (float(c), float(r))):
    """One row per Kelurahan (USERFLOW.md §5). "Separuh" = the year half of its land is below Pasang Tertinggi:
    the median over its points of the earliest and latest Tahun Rob, so it reads like a Kelurahan-wide Rentang Tahun.
    lon/lat: the point with data nearest the middle of the Kelurahan, so a link opens on a Kartu titik with numbers."""
    has = rob["robYear_continue"] != -1
    rows = []
    for k, row in kel.iterrows():
        m = has & (grid == k)
        if m.sum() < MIN_POINTS:
            continue
        lo, mid, hi = (np.median(rob[f"robYear{p}_continue"][m]) for p in ("Min", "", "Max"))
        if mid == ALREADY:
            half = ("sudah", "sudah")
        elif lo == NEVER:
            half = (">2050", ">2050")
        else:
            a, b = max(int(lo), int(YEARS[0])), int(YEARS[-1]) + 1 if hi == NEVER else int(hi)
            half = ("belum bisa diperkirakan",) * 2 if b - a > RENTANG_MAKS else (a, ">2050" if hi == NEVER else b)
        below = lambda s: (rob[f"robYear_{s}"][m] != NEVER).mean()  # ALREADY or a year up to 2050
        rows_, cols_ = np.nonzero(m)
        i = np.argmin((rows_ - rows_.mean()) ** 2 + (cols_ - cols_.mean()) ** 2)
        lon, lat = to_lonlat(rows_[i], cols_[i])
        rows.append({"kode": row.code, "kelurahan": row["name"], "kecamatan": row.kecamatan, "kota": row.kota,
                     "lon": round(lon, 5), "lat": round(lat, 5), "titik": int(m.sum()),
                     "persen_isian": round(100 * (rob["filled"][m] == 1).mean()),
                     "laju_penurunan_median_cm": round(float(np.median(rate[m])), 1),
                     "persen_bawah_pasang_2026": round(100 * (rob["robYear_continue"][m] == ALREADY).mean()),
                     "persen_bawah_pasang_2050_lanjut": round(100 * below("continue")),
                     "persen_bawah_pasang_2050_henti": round(100 * below("stop")),
                     "ha_bawah_pasang_2050_lanjut": round(float(below("continue") * m.sum() * pixel_ha)),
                     "separuh_rob_paling_cepat": half[0], "separuh_rob_paling_lambat": half[1]})
    return rows


def kota_summary(rob, rate, kel, grid):
    """Median Laju Penurunan per kabupaten/kota, measured points only (no gap filling)."""
    measured = (rob["filled"] == 0)
    out = []
    for kota in sorted(kel.kota.unique()):
        m = measured & np.isin(grid, np.flatnonzero(kel.kota == kota))
        out.append({"kota": kota, "titik": int(m.sum()), "lajuMedian": round(float(np.median(rate[m])), 1),
                     "lajuP90": round(float(np.percentile(rate[m], 90)), 1)})
    return out


def constellation(points):
    """Every n-th measured point (lon, lat, cm/tahun) for the Konstelasi Titik on the Tentang page."""
    idx = [i for i, f in enumerate(points["filled"]) if f == 0]
    idx = idx[::max(1, len(idx) // CONSTELLATION)]
    return {"updated": date.today().isoformat(),
            "points": [[points["lon"][i], points["lat"][i], points["subsidenceRate"][i]] for i in idx]}


def point_columns(rob, elev, rate, std, transform, crs):
    """Every measured InSAR pixel, column by column (one list per field). The browser finds the nearest
    point to a tap itself, so the 31k points never have to be drawn."""
    from rasterio.transform import xy
    from rasterio.warp import transform as reproject_xy

    rows, cols = np.nonzero(rob["robYear_continue"] != -1)
    lons, lats = reproject_xy(crs, "EPSG:4326", *xy(transform, rows, cols))
    out = {"lon": np.round(lons, 5).tolist(), "lat": np.round(lats, 5).tolist(),
           "elevation": np.round(elev[rows, cols], 2).tolist(),
           "subsidenceRate": np.round(rate[rows, cols], 1).tolist(),
           "subsidenceRateStd": np.round(std[rows, cols], 1).tolist()}
    for name, band in rob.items():
        out[name] = band[rows, cols].astype(int).tolist()
    return out


def backtest():
    f = WORK / "backtest.json"
    return json.loads(f.read_text()) if f.exists() else {}


def water_polygons(year=2025):
    """Land that really is water now: >= 80% of clear Sentinel-2 scenes show water, on ground DeltaDTM still
    maps as land (so the open sea is left out). Includes tambak, which are water by design."""
    import rasterio
    from rasterio.features import shapes
    from rasterio.warp import Resampling, reproject, transform_geom
    from shapely.geometry import mapping, shape
    from shapely.ops import unary_union

    with rasterio.open(WORK / f"water_coast_{year}.tif") as w:
        frac, prof = w.read(1), w.profile
    land = np.full(frac.shape, np.nan, "float32")
    with rasterio.open(WORK / "elevation.tif") as d:
        reproject(rasterio.band(d, 1), land, dst_transform=prof["transform"], dst_crs=prof["crs"],
                  dst_nodata=np.nan, resampling=Resampling.nearest)
    mask = ((frac >= 0.8) & np.isfinite(land)).astype("uint8")
    parts = [shape(g) for g, v in shapes(mask, mask=mask.astype(bool), transform=prof["transform"]) if v == 1]
    geom = unary_union(parts).simplify(SIMPLIFY_M / 2)
    return {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"year": year},
            "geometry": transform_geom(prof["crs"], "EPSG:4326", mapping(geom), precision=4)}]}


def main():
    import rasterio

    with rasterio.open(WORK / "rob.tif") as r:
        rob = {name: r.read(i + 1) for i, name in enumerate(r.descriptions)}
        transform, crs = r.transform, r.crs
    elev, rate, std, _ = load_inputs()
    rate, std, _ = fill_gaps(rate, std, np.isfinite(elev))  # same values compute.py used
    tide = json.loads((WORK / "tide.json").read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    polys = below_tide_polygons(rob, transform, crs)
    points = point_columns(rob, elev, rate, std, transform, crs)
    kel, grid = kelurahan_grid(rob["filled"].shape, transform, crs)
    rows, cols = np.nonzero(rob["robYear_continue"] != -1)  # same order as point_columns
    points["kelurahan"] = grid[rows, cols].tolist()
    (OUT / "kelurahan.json").write_text(json.dumps(kel[["code", "name", "kecamatan", "kota"]].values.tolist()))
    def to_lonlat(r, c):
        from rasterio.transform import xy
        from rasterio.warp import transform as reproject_xy
        (lon,), (lat,) = reproject_xy(crs, "EPSG:4326", *[[v] for v in xy(transform, r, c)])
        return lon, lat
    ranked = ranking(rob, rate, kel, grid, abs(transform.a * transform.e) / 1e4, to_lonlat)
    with open(OUT / "ranking.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(ranked[0]))
        w.writeheader()
        w.writerows(ranked)
    (OUT / "constellation.json").write_text(json.dumps(constellation(points), separators=(",", ":")))
    for level in LEVELS:  # one file per level, so the browser only downloads the level being looked at
        feats = [f for f in polys if f["properties"]["level"] == level]
        (OUT / f"below-tide-{level}.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats}))
    for old in ("below-tide.geojson", "below-tide-sea.geojson", "below-tide-flooded.geojson", "below-tide-lost.geojson"):
        (OUT / old).unlink(missing_ok=True)
    (OUT / "water-2025.geojson").write_text(json.dumps(water_polygons()))
    (OUT / "points.json").write_text(json.dumps(points, separators=(",", ":"), allow_nan=False))
    (OUT / "meta.json").write_text(json.dumps({
        "updated": date.today().isoformat(), "years": [int(YEARS[0]), int(YEARS[-1])],
        "highestTide": tide["highest_tide"], "dailyHighTide": tide["daily_high_tide"],
        "validated": backtest().get("passed", False),  # Uji Mundur passed (docs/PRD.md §5)
        # share of land predicted below Pasang Harian that really turned into water 2017→2025 (legend text)
        "dailyPrecision": backtest().get("coast", {}).get("daily_precision"),
        "kota": kota_summary(rob, rate, kel, grid),
    }, indent=2))
    for f in [f"below-tide-{lv}.geojson" for lv in LEVELS] + ["water-2025.geojson", "points.json", "ranking.csv"]:
        print(f"{f}: {(OUT / f).stat().st_size / 1e6:.1f} MB")
    print(f"{len(polys)} polygons, {len(points['lon'])} points, {len(ranked)} Kelurahan ranked")


if __name__ == "__main__":
    main()
