"""Pasang Tertinggi and Pasang Harian from the IOC Semarang tide gauge (docs/DATA.md §2.1).

    python pipeline/fetch_tide.py   # -> work/tide.json + public/data/tide.json (daily high water, next PREDICT_DAYS)

Heights are relative to the gauge's own local mean sea level (31-day running median), so the gauge datum
(which jumps when the sensor is re-installed or re-set) and the gauge sinking with the ground both drop out.
"""
import json
from datetime import date
from pathlib import Path

import numpy as np

STATION = "sema"
SENSOR = "prs"           # pressure sensor: the most complete record since 2015
FIRST_YEAR = 2015
JUMP = 0.25              # m, lasting level shift treated as a datum jump (re-installation)
JUMP_DAYS = 14           # ... measured as the median of 14 days after vs 14 days before
MIN_RANGE, MAX_RANGE = 0.2, 2.0  # m, a day's hourly tide range outside this is a broken sensor day
WINDOW_DAYS = 31         # local mean sea level = running median over this many days
# ponytail: a 31-day mean also removes the seasonal sea-level cycle (±10–15 cm), so Pasang Tertinggi is a bit low.
# Add the seasonal anomaly from altimetry if Uji Mundur shows the rob arriving later than observed.
MIN_COVERAGE = 0.8       # a year needs 80% of its days usable to count
WORK = Path(__file__).parent / "work"
RAW = WORK / "tide"
WEB = Path(__file__).parent.parent / "public" / "data" / "tide.json"
# Tidal constituents (hours per cycle). One year of hourly data separates K1/P1 and S2/K2.
PERIODS = {"Q1": 26.868357, "O1": 25.819342, "P1": 24.065890, "K1": 23.934470, "N2": 12.658348,
           "M2": 12.420601, "S2": 12.0, "K2": 11.967235, "M4": 6.210300, "MS4": 6.103339}
FIT_DAYS = 365
PREDICT_DAYS = 120  # so the banner still has the coming week if the weekly update is late
# ponytail: no nodal corrections (18.6-year cycle); negligible when fitting the last year and predicting months ahead.
API = "https://www.ioc-sealevelmonitoring.org/service.php"


def download():
    """One CSV per month (unix seconds, metres). Past months are never re-downloaded."""
    import requests

    RAW.mkdir(parents=True, exist_ok=True)
    today = date.today()
    for y in range(FIRST_YEAR, today.year + 1):
        for m in range(1, 13):
            if (y, m) > (today.year, today.month):
                return
            f = RAW / f"{STATION}-{y}-{m:02d}.csv"
            if f.exists() and (y, m) != (today.year, today.month):
                continue
            nxt = f"{y + (m == 12)}-{m % 12 + 1:02d}-01"
            rows = requests.get(API, params=dict(query="data", code=STATION, timestart=f"{y}-{m:02d}-01",
                                                 timestop=nxt, format="json"), timeout=300).json()
            ts = [(np.datetime64(r["stime"].replace(" ", "T")).astype("datetime64[s]").astype(int), r["slevel"])
                  for r in rows if r["sensor"] == SENSOR]
            np.savetxt(f, np.array(ts, dtype="float64").reshape(-1, 2), fmt="%d,%.3f")
            print(f.name, len(ts))


def load():
    parts = [np.loadtxt(f, delimiter=",", ndmin=2) for f in sorted(RAW.glob(f"{STATION}-*.csv")) if f.stat().st_size]
    t, h = np.concatenate(parts).T
    order = np.argsort(t)
    return t[order], h[order]


def hourly(t, h):
    """Hourly medians, which shrug off single-sample spikes and dropouts (exact 0)."""
    keep = h != 0
    hour = (t[keep] // 3600).astype(int)
    hours, idx = np.unique(hour, return_index=True)
    return hours * 3600.0, np.array([np.median(c) for c in np.split(h[keep], idx[1:])])


def good_days(t, h):
    """Drop days whose tide looks broken: a range no real Semarang tide has, or too few hours."""
    day = (t // 86400).astype(int)
    days, idx, counts = np.unique(day, return_index=True, return_counts=True)
    rng = np.array([c.max() - c.min() for c in np.split(h, idx[1:])])
    ok_day = (counts >= 20) & (rng > MIN_RANGE) & (rng < MAX_RANGE)
    keep = np.repeat(ok_day, counts)
    return t[keep], h[keep]


def segments(t, h):
    """Segment id per sample. A datum jump is a lasting shift: the median level of the JUMP_DAYS after a
    day differs by more than JUMP from the JUMP_DAYS before it (a noisy day or two does not count)."""
    day = (t // 86400).astype(int)
    days, idx, inv = np.unique(day, return_index=True, return_inverse=True)
    med = np.array([np.median(c) for c in np.split(h, idx[1:])])
    k = JUMP_DAYS
    shift = np.array([np.median(med[i:i + k]) - np.median(med[max(0, i - k):i]) if k <= i <= len(med) - k else 0
                      for i in range(len(med))])
    peak = (np.abs(shift) > JUMP) & (np.abs(shift) == np.array(
        [np.abs(shift[max(0, i - k):i + k]).max() for i in range(len(med))]))
    return np.cumsum(peak)[inv]


def anomalies(t, h, seg):
    """Height above local mean sea level: the running median of the WINDOW_DAYS around each day,
    never crossing a datum jump. Days without a full window on both sides are dropped."""
    day = (t // 86400).astype(int)
    keep = np.zeros(len(t), bool)
    msl = np.zeros(len(t))
    for s in np.unique(seg):
        m = seg == s
        days, idx, inv = np.unique(day[m], return_index=True, return_inverse=True)
        med = np.array([np.median(c) for c in np.split(h[m], idx[1:])])
        w = WINDOW_DAYS // 2
        local = np.array([np.median(med[i - w:i + w + 1]) if w <= i < len(med) - w else np.nan for i in range(len(med))])
        msl[m], keep[m] = local[inv], np.isfinite(local[inv])
    return t[keep], (h - msl)[keep]


def yearly_levels(t, anom):
    """{year: (highest, daily_high)}: the year's highest daily high water, and the mean daily high water."""
    day = (t // 86400).astype(int)
    days, idx = np.unique(day, return_index=True)
    daily_max = np.array([c.max() for c in np.split(anom, idx[1:])])
    years = days // 365.2425 + 1970
    out = {}
    for y in np.unique(years):
        m = years == y
        if m.sum() >= MIN_COVERAGE * 365:
            out[int(y)] = (float(daily_max[m].max()), float(daily_max[m].mean()))
    return out


def fit_tide(t, h):
    """Least-squares amplitude of each constituent. Returns (mean, cos/sin coefficients)."""
    w = 2 * np.pi / (np.array(list(PERIODS.values())) * 3600)
    a = np.column_stack([np.ones_like(t), np.cos(np.outer(t, w)), np.sin(np.outer(t, w))])
    return np.linalg.lstsq(a, h, rcond=None)[0]


def predict_tide(coef, t):
    w = 2 * np.pi / (np.array(list(PERIODS.values())) * 3600)
    n = len(w)
    return coef[0] + np.cos(np.outer(t, w)) @ coef[1:n + 1] + np.sin(np.outer(t, w)) @ coef[n + 1:]


def daily_highs(t, h):
    """[(time, height)] of the highest water each day (WIB, UTC+7, since that is the day people live in)."""
    day = ((t + 7 * 3600) // 86400).astype(int)
    _, idx = np.unique(day, return_index=True)
    return [(int(c_t[np.argmax(c_h)]), float(c_h.max())) for c_t, c_h in zip(np.split(t, idx[1:]), np.split(h, idx[1:]))]


def forecast(t, anom):
    """Fit the last FIT_DAYS of measured tide, predict every 10 minutes from today. Prints the skill on the
    last 30 measured days held out, so a broken fit shows up in the log."""
    test = t > t[-1] - 30 * 86400
    held = fit_tide(t[~test][t[~test] > t[~test][-1] - FIT_DAYS * 86400], anom[~test][t[~test] > t[~test][-1] - FIT_DAYS * 86400])
    (mt, mh), (pt, ph) = zip(*daily_highs(t[test], anom[test])), zip(*daily_highs(t[test], predict_tide(held, t[test])))
    print(f"Uji 30 hari terakhir: tinggi air harian meleset {np.mean(np.abs(np.subtract(mh, ph))) * 100:.0f} cm, "
          f"jam meleset median {np.median(np.abs(np.subtract(mt, pt))) / 3600:.1f} jam")
    recent = t > t[-1] - FIT_DAYS * 86400
    coef = fit_tide(t[recent], anom[recent])
    start = float(np.datetime64(date.today(), "s").astype(int))
    future = start + np.arange(0, PREDICT_DAYS * 86400, 600, dtype="float64")
    return daily_highs(future, predict_tide(coef, future))


def main():
    download()
    t, h = good_days(*hourly(*load()))
    ta, anom = anomalies(t, h, segments(t, h))
    levels = yearly_levels(ta, anom)
    for y, (hi, daily) in levels.items():
        print(f"{y}: Pasang Tertinggi {hi:+.2f} m, Pasang Harian {daily:+.2f} m")
    hi, daily = (float(np.mean([v[i] for v in levels.values()])) for i in range(2))
    result = {"station": f"IOC {STATION}", "sensor": SENSOR, "years": sorted(levels),
              "highest_tide": round(hi, 3), "daily_high_tide": round(daily, 3),
              "per_year": {y: {"highest_tide": round(a, 3), "daily_high_tide": round(b, 3)} for y, (a, b) in levels.items()},
              "updated": date.today().isoformat()}
    (WORK / "tide.json").write_text(json.dumps(result, indent=2))
    print(f"Pasang Tertinggi {hi:.2f} m, Pasang Harian {daily:.2f} m di atas MSL ({len(levels)} tahun)")
    WEB.write_text(json.dumps({"updated": date.today().isoformat(), "station": "IOC Semarang (sema)",
                               "highs": [[tt, round(hh, 2)] for tt, hh in forecast(ta, anom)]}, separators=(",", ":")))
    print(f"{WEB.name}: {PREDICT_DAYS} hari pasang tinggi harian")


if __name__ == "__main__":
    main()
