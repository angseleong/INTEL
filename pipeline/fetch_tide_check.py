"""Tide prediction on a made-up tide with known constituents: python pipeline/fetch_tide_check.py"""
import numpy as np

from fetch_tide import PERIODS, daily_highs, fit_tide, predict_tide

t = np.arange(0, 400 * 86400, 3600, dtype="float64")
truth = lambda x: 0.05 + 0.3 * np.cos(2 * np.pi * x / (PERIODS["K1"] * 3600) + 1) + 0.2 * np.cos(2 * np.pi * x / (PERIODS["M2"] * 3600))
coef = fit_tide(t[:365 * 24], truth(t[:365 * 24]) + np.random.default_rng(0).normal(0, 0.05, 365 * 24))
future = t[365 * 24:]
assert np.abs(predict_tide(coef, future) - truth(future)).max() < 0.02, "prediction drifts from the known tide"
for (tt, ht), (tp, hp) in zip(daily_highs(future, truth(future)), daily_highs(future, predict_tide(coef, future))):
    assert abs(ht - hp) < 0.03 and abs(tt - tp) <= 3600, (tt, ht, tp, hp)  # same daily high water, same hour
print("OK")
