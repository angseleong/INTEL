import numpy as np

from backtest import scores

pred = np.array([True, True, False, False])
truth = np.array([True, False, True, False])
assert scores(pred, truth) == (0.5, 0.5)
assert scores(truth, truth) == (1.0, 1.0)
assert np.isnan(scores(pred, np.zeros(4, bool))[0])  # nothing became water: recall undefined, not 0
print("backtest ok")
