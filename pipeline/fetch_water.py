"""Where the water really is, per year, from Sentinel-2 (docs/DATA.md §5, Uji Mundur).

    python pipeline/fetch_water.py 2017 2025   # -> work/water_2017.tif, work/water_2025.tif

Per 20 m pixel: share of cloud-free scenes in which it looks like water (MNDWI > 0), and how many
cloud-free scenes there were. Scenes come from the public Sentinel-2 COG archive on AWS, no login.
"""
import sys
from pathlib import Path

import numpy as np

STAC = "https://earth-search.aws.element84.com/v1/search"
TILE = "49MDN"  # the one Sentinel-2 tile covering Sayung
BOX = (110.46, -6.97, 110.56, -6.88)  # Kecamatan Sayung, Demak (lon/lat). ponytail: box, not the admin outline
MAX_CLOUD = 60
CLEAR_SCL = (4, 5, 6, 7)  # vegetation, bare soil, water, unclassified. Excludes cloud, shadow, no data
WORK = Path(__file__).parent / "work"


def water_fraction(greens, swirs, scls):
    """(share of clear scenes that are water, number of clear scenes) per pixel."""
    water = np.zeros(greens[0].shape)
    clear = np.zeros(greens[0].shape)
    for g, s, c in zip(greens, swirs, scls):
        ok = np.isin(c, CLEAR_SCL) & (g + s > 0)
        with np.errstate(invalid="ignore", divide="ignore"):
            wet = (g - s) / (g + s) > 0
        water += ok & wet
        clear += ok
    with np.errstate(invalid="ignore", divide="ignore"):
        return np.where(clear > 0, water / clear, np.nan), clear


def scenes(year):
    import requests

    body = {"collections": ["sentinel-2-l2a"], "bbox": list(BOX), "limit": 200,
            "datetime": f"{year}-01-01T00:00:00Z/{year}-12-31T23:59:59Z", "query": {"eo:cloud_cover": {"lt": MAX_CLOUD}}}
    feats = requests.post(STAC, json=body, timeout=120).json()["features"]
    return [f for f in feats if TILE in f["id"]]


def year_water(year):
    import rasterio
    from rasterio.enums import Resampling
    from rasterio.warp import transform_bounds
    from rasterio.windows import from_bounds

    items = scenes(year)
    greens, swirs, scls = [], [], []
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", AWS_NO_SIGN_REQUEST="YES"):
        for it in items:
            a = it["assets"]
            with rasterio.open(a["scl"]["href"]) as r:  # 20 m grid is the output grid
                win = from_bounds(*transform_bounds("EPSG:4326", r.crs, *BOX), r.transform).round_offsets().round_lengths()
                shape = (int(win.height), int(win.width))
                scls.append(r.read(1, window=win))
                prof = r.profile | {"height": shape[0], "width": shape[1], "transform": r.window_transform(win)}
            with rasterio.open(a["swir16"]["href"]) as r:
                swirs.append(r.read(1, window=win).astype("float32"))
            with rasterio.open(a["green"]["href"]) as r:  # 10 m, averaged onto the 20 m grid
                gw = from_bounds(*transform_bounds("EPSG:4326", r.crs, *BOX), r.transform)
                greens.append(r.read(1, window=gw, out_shape=shape, resampling=Resampling.average).astype("float32"))
    frac, clear = water_fraction(greens, swirs, scls)
    out = WORK / f"water_{year}.tif"
    with rasterio.open(out, "w", **(prof | {"count": 2, "dtype": "float32", "nodata": np.nan, "driver": "GTiff"})) as d:
        d.write(np.stack([frac, clear]).astype("float32"))
        d.set_band_description(1, "water_fraction")
        d.set_band_description(2, "clear_scenes")
    print(f"{out.name}: {len(items)} scenes, median {np.median(clear):.0f} clear per pixel, "
          f"{np.nanmean(frac >= 0.8):.0%} permanent water")


if __name__ == "__main__":
    for y in sys.argv[1:] or ["2017", "2025"]:
        year_water(int(y))
