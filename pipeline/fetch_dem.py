"""Tinggi Tanah above mean sea level: DeltaDTM minus the DTU22 MDT (docs/DATA.md §2.1).

    python pipeline/fetch_dem.py   # -> work/elevation.tif (m above MSL, reference year compute.T0)

DeltaDTM only ships as per-continent zips (Asia 17 GB). HTTP range requests pull just our tiles out.
"""
import gzip
import io
import urllib.request
import zipfile
from pathlib import Path

import numpy as np

ASIA_ZIP = "https://data.4tu.nl/file/1da2e70f-6c4d-4b03-86bd-b53e789cc629/672eba4c-1334-44c6-8119-8879ded25912"
TILES = ["DeltaDTM_v1_1_S07E110.tif", "DeltaDTM_v1_1_S08E110.tif"]  # named by their lower-left corner
MDT_URL = "https://ftp.space.dtu.dk/pub/DTU22/MDT/dtu22mdt.xyz.gz"
MDT_AT = (110.45, -6.85)  # open water off Semarang–Sayung, where the 0.125° MDT grid is valid
BOUNDS = (110.30, -7.02, 110.65, -6.82)  # Wilayah Cakupan, same box as fetch_insar.AOI
WORK = Path(__file__).parent / "work"


class HTTPRange(io.RawIOBase):
    """Seekable read-only file over HTTP Range requests, so zipfile reads one member, not the whole zip."""

    def __init__(self, url):
        r = urllib.request.urlopen(urllib.request.Request(url, headers={"Range": "bytes=0-0"}))
        self.url, self.pos = r.geturl(), 0
        self.size = int(r.headers["Content-Range"].split("/")[1])

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, off, whence=0):
        self.pos = off if whence == 0 else self.pos + off if whence == 1 else self.size + off
        return self.pos

    def readinto(self, b):
        if not len(b) or self.pos >= self.size:
            return 0
        end = min(self.pos + len(b), self.size) - 1
        data = urllib.request.urlopen(urllib.request.Request(self.url, headers={"Range": f"bytes={self.pos}-{end}"})).read()
        b[:len(data)] = data
        self.pos += len(data)
        return len(data)


def mdt():
    """Nearest DTU22 MDT value to MDT_AT, in m."""
    f = WORK / "dtu22mdt.xyz.gz"
    if not f.exists():
        urllib.request.urlretrieve(MDT_URL, f)
    best = (np.inf, None)
    with gzip.open(f, "rt") as lines:
        for line in lines:
            x, y, v = (float(p) for p in line.split()[:3])
            d = (x - MDT_AT[0]) ** 2 + (y - MDT_AT[1]) ** 2
            if d < best[0]:
                best = (d, v)
    return best[1]


def main():
    import rasterio
    from rasterio.merge import merge

    WORK.mkdir(exist_ok=True)
    z = zipfile.ZipFile(io.BufferedReader(HTTPRange(ASIA_ZIP), 1 << 20))
    for name in TILES:
        if not (WORK / name).exists():
            (WORK / name).write_bytes(z.read(name))
    srcs = [rasterio.open(WORK / n) for n in TILES]
    elev, transform = merge(srcs, bounds=BOUNDS, nodata=np.nan, dtype="float32")
    offset = mdt()
    elev = elev[0] - offset
    prof = srcs[0].profile | {"height": elev.shape[0], "width": elev.shape[1], "transform": transform,
                              "dtype": "float32", "nodata": np.nan, "compress": "deflate"}
    with rasterio.open(WORK / "elevation.tif", "w", **prof) as dst:
        dst.write(elev, 1)
        dst.update_tags(source="DeltaDTM v1.1 minus DTU22 MDT", mdt_m=f"{offset:.3f}")
    print(f"elevation.tif: MDT {offset:.3f} m, {np.isfinite(elev).mean():.0%} land pixels, "
          f"median {np.nanmedian(elev):.2f} m above MSL")


if __name__ == "__main__":
    main()
