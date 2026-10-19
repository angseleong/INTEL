from fetch_insar import granule_date, make_pairs

d = ["2015-01-03", "2015-01-15", "2015-01-27", "2015-02-08"]
assert make_pairs(d) == [
    ("2015-01-03", "2015-01-15"), ("2015-01-03", "2015-01-27"),
    ("2015-01-15", "2015-01-27"), ("2015-01-15", "2015-02-08"),
    ("2015-01-27", "2015-02-08"),
]
assert make_pairs(d[::-1] + d[:1]) == make_pairs(d), "order and duplicates must not matter"
assert make_pairs(d[:1]) == []
assert granule_date("S1_272740_IW1_20141014T104555_VV_8F3A-BURST") == "2014-10-14"

# Re-referencing: a field reading −4 everywhere in the stable box gives an offset of −4
import numpy as np
from rasterio.transform import from_origin
from fetch_insar import stable_offset
grid = np.full((200, 200), -4.0)
assert abs(stable_offset(grid, from_origin(110.30, -6.98, 0.001, 0.001), "EPSG:4326") + 4) < 1e-9
print("fetch_insar ok")
