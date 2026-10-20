"""Before/after images of Air Nyata for the Cerita Kota (docs/USERFLOW.md §1.1 no. 5):

    python pipeline/story.py   # work/water_coast_{2017,2025}.tif -> public/story/{kota}-{year}.png

Water = at least 80% of clear Sentinel-2 scenes that year show water (same rule as the Air Nyata layer).
"""
import os
from pathlib import Path

import numpy as np

from compute import WORK

OUT = Path(__file__).parent.parent / "public" / "story"
BOXES = {"demak": (110.46, -6.97, 110.56, -6.88),     # Sayung: Bedono, Timbulsloko
         "semarang": (110.39, -6.99, 110.49, -6.92)}  # Tanjung Mas, Tambak Lorok, Kaligawe, Genuk
LAND, WATER = (51, 51, 51), (18, 63, 134)  # DESIGN.md: Air Nyata is Laut Pasang #123f86


def main():
    import rasterio
    from rasterio.warp import transform_bounds
    from rasterio.windows import from_bounds

    os.environ["GDAL_PAM_ENABLED"] = "NO"  # no .aux.xml next to the PNGs
    OUT.mkdir(parents=True, exist_ok=True)
    for kota, box in BOXES.items():
        for year in (2017, 2025):
            with rasterio.open(WORK / f"water_coast_{year}.tif") as r:
                frac = r.read(1, window=from_bounds(*transform_bounds("EPSG:4326", r.crs, *box), r.transform))
            wet = np.nan_to_num(frac) >= 0.8
            rgb = np.where(wet[None], np.array(WATER)[:, None, None], np.array(LAND)[:, None, None]).astype("uint8")
            with rasterio.open(OUT / f"{kota}-{year}.png", "w", driver="PNG", width=rgb.shape[2], height=rgb.shape[1],
                               count=3, dtype="uint8") as dst:
                dst.write(rgb)
            print(f"{kota}-{year}.png: {wet.mean():.0%} air")


if __name__ == "__main__":
    main()
