import numpy as np

from fetch_water import water_fraction

g = np.array([[100.0, 300.0]])  # pixel 0 water-like (green > swir), pixel 1 land-like
s = np.array([[50.0, 600.0]])
clear, cloud = np.array([[4, 4]]), np.array([[9, 9]])
frac, n = water_fraction([g, g, g], [s, s, s], [clear, clear, cloud])
assert n.tolist() == [[2, 2]], n          # the cloudy scene does not count
assert frac.tolist() == [[1.0, 0.0]], frac
frac, n = water_fraction([g], [s], [cloud])
assert np.isnan(frac).all() and n.sum() == 0  # never seen clearly: unknown, not dry
print("fetch_water ok")
