"""Tinggi Tanah above mean sea level: DeltaDTM minus local mean sea level above EGM2008 (docs/DATA.md §2.1).

    python pipeline/fetch_dem.py   # -> work/elevation.tif (m above MSL, reference year compute.T0)

DeltaDTM only ships as per-continent zips (Asia 17 GB). HTTP range requests pull just our tiles out.
"""
import io
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

import numpy as np

ASIA_ZIP = "https://data.4tu.nl/file/1da2e70f-6c4d-4b03-86bd-b53e789cc629/672eba4c-1334-44c6-8119-8879ded25912"
TILES = ["DeltaDTM_v1_1_S07E110.tif", "DeltaDTM_v1_1_S08E110.tif"]  # named by their lower-left corner
# Mean sea level off Semarang above the EGM2008 geoid that DeltaDTM uses: 7 ICESat-2 passes 2019–2025,
# each corrected for the tide at that moment from the IOC sema gauge (0.62–0.78 m, ±0.04 m).
# DTU22 MDT gives 1.008 m here but is referenced to the XGM2019e geoid, not EGM2008.
MSL_ABOVE_EGM2008 = 0.75
BOUNDS = (110.30, -7.02, 110.65, -6.82)  # Wilayah Cakupan, same box as fetch_insar.AOI
WORK = Path(__file__).parent / "work"


class HTTPRange(io.RawIOBase):
    """Seekable read-only file over HTTP Range requests, so zipfile reads one member, not the whole zip."""

    def __init__(self, url):
        self.origin, self.pos = url, 0
        self.resolve()

    def resolve(self):
        """Follow redirects once. Some hosts (HDX) redirect to a signed URL that expires after a while."""
        r = urllib.request.urlopen(urllib.request.Request(self.origin, headers={"Range": "bytes=0-0"}))
        self.url, self.size = r.geturl(), int(r.headers["Content-Range"].split("/")[1])

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
        get = lambda: urllib.request.urlopen(urllib.request.Request(self.url, headers={"Range": f"bytes={self.pos}-{end}"})).read()
        try:
            data = get()
        except urllib.error.HTTPError as e:
            if e.code != 403:
                raise
            self.resolve()  # signed URL expired
            data = get()
        b[:len(data)] = data
        self.pos += len(data)
        return len(data)


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
    offset = MSL_ABOVE_EGM2008
    elev = elev[0] - offset
    prof = srcs[0].profile | {"height": elev.shape[0], "width": elev.shape[1], "transform": transform,
                              "dtype": "float32", "nodata": np.nan, "compress": "deflate"}
    with rasterio.open(WORK / "elevation.tif", "w", **prof) as dst:
        dst.write(elev, 1)
        dst.update_tags(source="DeltaDTM v1.1 minus ICESat-2 mean sea level", msl_above_egm2008_m=f"{offset:.3f}")
    print(f"elevation.tif: MSL {offset:.3f} m above EGM2008, {np.isfinite(elev).mean():.0%} land pixels, "
          f"median {np.nanmedian(elev):.2f} m above MSL")


if __name__ == "__main__":
    main()
