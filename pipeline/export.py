"""work/rob.tif -> files the web map reads (docs/ARCHITECTURE.md §4).

    python pipeline/export.py   # -> public/data/below-tide-{rob,flooded,lost}.geojson, points.json, meta.json

ponytail: plain GeoJSON while the map covers only Demak–Semarang (a few MB). Switch to PMTiles once Pantura is in.
"""
import json
from datetime import date
from itertools import product
from pathlib import Path

import numpy as np

from compute import ALREADY, NEVER, WORK, YEARS, fill_gaps, load_inputs

OUT = Path(__file__).parent.parent / "public" / "data"
SCENARIOS = ("continue", "stop")
LEVELS = ("rob", "flooded", "lost")  # Pasang Tertinggi, Pasang Harian, Surut Harian
SIMPLIFY_M = 60  # ¾ of an InSAR pixel; keeps the coastline shape, drops stair-steps


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


def validated():
    f = WORK / "backtest.json"
    return f.exists() and json.loads(f.read_text()).get("passed", False)


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
    for level in LEVELS:  # one file per level, so the browser only downloads the level being looked at
        feats = [f for f in polys if f["properties"]["level"] == level]
        (OUT / f"below-tide-{level}.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats}))
    (OUT / "below-tide.geojson").unlink(missing_ok=True)
    (OUT / "points.json").write_text(json.dumps(points, separators=(",", ":"), allow_nan=False))
    (OUT / "meta.json").write_text(json.dumps({
        "updated": date.today().isoformat(), "years": [int(YEARS[0]), int(YEARS[-1])],
        "highestTide": tide["highest_tide"], "dailyHighTide": tide["daily_high_tide"], "dailyLowTide": tide["daily_low_tide"],
        "validated": validated(),  # Uji Mundur passed (docs/PRD.md §5)
    }, indent=2))
    for f in [f"below-tide-{lv}.geojson" for lv in LEVELS] + ["points.json"]:
        print(f"{f}: {(OUT / f).stat().st_size / 1e6:.1f} MB")
    print(f"{len(polys)} polygons, {len(points['lon'])} points")


if __name__ == "__main__":
    main()
