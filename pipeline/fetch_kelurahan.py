"""Batas Kelurahan for Demak and Kota Semarang from HDX COD-AB (BPS), CC BY-IGO (docs/DATA.md §1).

    python pipeline/fetch_kelurahan.py   # -> work/kelurahan.geojson

The zip holds every admin level of Indonesia (498 MB). HTTP range requests pull just the admin4 files (±190 MB).
"""
import io
import zipfile

from fetch_dem import HTTPRange, WORK

ZIP = ("https://data.humdata.org/dataset/84a1d98a-790b-4d66-9d14-bbfa48500802/resource/"
       "50b9aafa-47c5-483e-a361-826320bf75d5/download/idn_admin_boundaries.shp.zip")
KABKOTA = ("ID3321", "ID3374")  # Kabupaten Demak, Kota Semarang. By code: Kabupaten Semarang (ID3322) shares the name
RAW = WORK / "admin4"


def main():
    import pyogrio

    RAW.mkdir(parents=True, exist_ok=True)
    z = zipfile.ZipFile(io.BufferedReader(HTTPRange(ZIP), 8 << 20))
    for ext in ("shp", "shx", "dbf", "prj", "cpg"):
        f = RAW / f"idn_admin4.{ext}"
        if not f.exists():
            f.write_bytes(z.read(f.name))
            print(f.name, f"{f.stat().st_size / 1e6:.0f} MB")
    gdf = pyogrio.read_dataframe(RAW / "idn_admin4.shp", where=" OR ".join(f"adm2_pcode = '{k}'" for k in KABKOTA))
    gdf = gdf.rename(columns={"adm4_pcode": "code", "adm4_name": "name", "adm3_name": "kecamatan", "adm2_name": "kota"})
    gdf[["code", "name", "kecamatan", "kota", "geometry"]].to_crs("EPSG:4326").to_file(WORK / "kelurahan.geojson", driver="GeoJSON")
    print(f"kelurahan.geojson: {len(gdf)} Kelurahan", gdf.groupby("kota").size().to_dict())


if __name__ == "__main__":
    main()
