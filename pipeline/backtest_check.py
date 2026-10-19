import numpy as np

from backtest import auc, scores

pred = np.array([True, True, False, False])
truth = np.array([True, False, True, False])
assert scores(pred, truth) == (0.5, 0.5)
assert scores(truth, truth) == (1.0, 1.0)
assert np.isnan(scores(pred, np.zeros(4, bool))[0])  # nothing became water: recall undefined, not 0
# AUC: perfect ranking 1, reversed 0, ties/random 0.5
truth = np.array([False, False, True, True])
assert auc(np.array([1.0, 2.0, 3.0, 4.0]), truth) == 1.0
assert auc(np.array([4.0, 3.0, 2.0, 1.0]), truth) == 0.0
assert abs(auc(np.array([1.0, 3.0, 2.0, 4.0]), truth) - 0.75) < 1e-9
print("backtest ok")
