import numpy as np

import compute
from compute import ALREADY, NEVER, fill_gaps, first_year_below, too_uncertain, year_range

compute.T0 = 2020  # the hand-worked cases below assume this reference year, whatever the pipeline uses

# Ground 1.5 m above MSL in 2020, sinking 10 cm/tahun, tide 0.65 m, sea not rising:
# 1.5 - 0.1(t - 2020) < 0.65  ->  t > 2028.5  ->  2029   (cases avoid landing exactly on the boundary)
assert first_year_below(1.5, 0.1, 0.65, 0.0, "continue") == 2029
# Same, sea rising 3 cm/tahun from 2026:  0.13 t > 263.63  ->  t > 2027.9  ->  2028
assert first_year_below(1.5, 0.1, 0.65, 0.03, "continue") == 2028
# Tide 0.45 m. Lanjut: t - 2020 > 10.5 -> 2031.
# Henti: 0.8 m left in 2027, then drops 0.1(x - x²/20); below 0.45 when x > 10 - √30 = 4.52 -> 2032
assert first_year_below(1.5, 0.1, 0.45, 0.0, "continue") == 2031
assert first_year_below(1.5, 0.1, 0.45, 0.0, "stop") == 2032
# Henti never goes lower than 1.5 - 0.7 - 0.5 = 0.3 m
assert first_year_below(1.5, 0.1, 0.29, 0.0, "stop") == NEVER
assert first_year_below(1.0, 0.1, 0.65, 0.0, "continue") == ALREADY  # 0.4 m left in 2026
assert first_year_below(5.0, 0.1, 0.65, 0.0, "continue") == NEVER
# Works on arrays, point by point
assert list(first_year_below(np.array([1.0, 1.5, 5.0]), 0.1, 0.65, 0.0, "continue")) == [ALREADY, 2029, NEVER]

lo, mid, hi = year_range(np.array([1.5]), np.array([0.1]), np.array([0.02]), 0.6, "continue")
assert lo[0] <= mid[0] <= hi[0], (lo, mid, hi)

assert too_uncertain(np.array([2030]), np.array([2045]))[0]
assert not too_uncertain(np.array([2030]), np.array([2035]))[0]
assert not too_uncertain(np.array([ALREADY]), np.array([ALREADY]))[0]
assert not too_uncertain(np.array([NEVER]), np.array([NEVER]))[0]
assert too_uncertain(np.array([2032]), np.array([NEVER]))[0]  # 2032 … after 2050 is 19+ years wide

# Gap filling: a hole in a field of 10 cm/tahun is filled with 10; a hole with too few neighbours stays empty
compute.FILL_RADIUS_PX, compute.FILL_MIN_NEIGHBOURS = 1, 5
rate = np.full((5, 5), 10.0); rate[2, 2] = np.nan; rate[0, 0] = np.nan
std = np.full((5, 5), 1.0)
land = np.ones((5, 5), bool)
r, s, f = fill_gaps(rate, std, land)
assert f[2, 2] and abs(r[2, 2] - 10) < 1e-6 and abs(s[2, 2] - 1) < 1e-6, (r[2, 2], s[2, 2])
assert not f[0, 0] and np.isnan(r[0, 0])  # corner: only 3 measured neighbours
assert not f[1, 1] and r[1, 1] == 10  # measured pixels are never touched
r, s, f = fill_gaps(rate, std, np.zeros((5, 5), bool))
assert not f.any()  # never fills the sea
print("compute ok")
