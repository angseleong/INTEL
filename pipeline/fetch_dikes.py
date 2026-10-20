"""Tanggul from OpenStreetMap (docs/DATA.md §1): python pipeline/fetch_dikes.py  # -> public/data/dikes.geojson

Shown as information only. INTEL does not compute what a Tanggul holds back (docs/PRD.md §1.3).
"""
import json
from datetime import date
from pathlib import Path

import requests

AREA = (110.3, -7.02, 110.65, -6.82)  # Wilayah Cakupan, same box as compute.py
COAST_KM = 3  # "embankment" is also used for road and rail embankments; inland ones are left out
OUT = Path(__file__).parent.parent / "public" / "data" / "dikes.geojson"
BBOX = f"({AREA[1]},{AREA[0]},{AREA[3]},{AREA[2]})"
QUERY = f"""[out:json][timeout:120];(
way["man_made"~"^(dyke|embankment|breakwater)$"]{BBOX};
way["embankment"="yes"]{BBOX};
way["barrier"="wall"]["wall"="flood_wall"]{BBOX};
way["natural"="coastline"]{BBOX};);out tags geom;"""


def main():
    from shapely.geometry import LineString, mapping
    from shapely.ops import unary_union

    r = requests.post("https://overpass-api.de/api/interpreter", data={"data": QUERY}, timeout=300,
                      headers={"User-Agent": "INTEL pipeline (github.com/angseleong/INTEL)"})
    r.raise_for_status()
    ways = r.json()["elements"]
    line = lambda w: LineString([(p["lon"], p["lat"]) for p in w["geometry"]])
    coast = unary_union([line(w) for w in ways if w["tags"].get("natural") == "coastline"])
    dikes = [w for w in ways if w["tags"].get("natural") != "coastline" and line(w).distance(coast) * 111 <= COAST_KM]
    OUT.write_text(json.dumps({"type": "FeatureCollection", "updated": date.today().isoformat(), "features": [
        {"type": "Feature", "properties": {"osm": w["id"]}, "geometry": mapping(line(w).simplify(0.00005))} for w in dikes]},
        separators=(",", ":")))
    print(f"{len(dikes)} Tanggul dalam {COAST_KM} km dari pantai ({len(ways)} garis OSM)")


if __name__ == "__main__":
    main()
