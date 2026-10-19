"""Laju Penurunan, step 1: Sentinel-1 burst InSAR pairs processed by ASF HyP3.

    python pipeline/fetch_insar.py search              # stack summary, no login needed
    python pipeline/fetch_insar.py submit [--dry-run]  # send missing pairs to HyP3
    python pipeline/fetch_insar.py download            # fetch finished pairs into pipeline/work/hyp3/

Login comes from EARTHDATA_USERNAME / EARTHDATA_PASSWORD, or ~/.netrc.
The time series (MintPy) step is added once the first products exist (docs/TODO.md Blok 2).
"""
import argparse
import os
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

# Wilayah Cakupan: Semarang + Demak coast. Every burst below covers all of it.
AOI = "POLYGON((110.30 -7.02,110.65 -7.02,110.65 -6.82,110.30 -6.82,110.30 -7.02))"
# Ascending track 127 has the densest archive (±440 dates since Oct 2014).
# ponytail: one track only, so motion is read as purely vertical (docs/DATA.md §2). Add descending 076 to split it.
BURSTS = ["127_272740_IW1", "127_272741_IW1"]
JOB_NAME = "intel-127"
NEIGHBOURS = 2  # each date is paired with its next 2 dates (small-baseline network)
LOOKS = "20x4"  # ±80 m pixels, 1 credit per job
KEEP = ("_unw_phase.tif", "_corr.tif", "_conncomp.tif", "_dem.tif", "_lv_theta.tif", "_lv_phi.tif", "_water_mask.tif", ".txt")
WORK = Path(__file__).parent / "work" / "hyp3"


def make_pairs(dates, neighbours=NEIGHBOURS):
    """Small-baseline pairs: every date with its next `neighbours` dates."""
    dates = sorted(set(dates))
    return [(a, b) for i, a in enumerate(dates) for b in dates[i + 1:i + 1 + neighbours]]


def stack():
    """{date: [granule per burst, in BURSTS order]} for dates where every burst exists."""
    import asf_search as asf

    found = defaultdict(dict)
    for r in asf.search(dataset=asf.DATASET.SLC_BURST, intersectsWith=AOI, polarization="VV", maxResults=20000):
        p = r.properties
        if p["burst"]["fullBurstID"] in BURSTS:
            found[p["startTime"][:10]][p["burst"]["fullBurstID"]] = p["sceneName"]
    return {d: [g[b] for b in BURSTS] for d, g in sorted(found.items()) if len(g) == len(BURSTS)}


def hyp3():
    from hyp3_sdk import HyP3

    return HyP3(username=os.environ.get("EARTHDATA_USERNAME"), password=os.environ.get("EARTHDATA_PASSWORD"))


def submitted_pairs(api):
    """Pairs already sent, so re-running never pays twice for the same pair."""
    return {(granule_date(j.job_parameters["reference"][0]), granule_date(j.job_parameters["secondary"][0]))
            for j in api.find_jobs(name=JOB_NAME) if not j.failed()}


def granule_date(name):
    """'S1_272740_IW1_20141014T104555_VV_8F3A-BURST' -> '2014-10-14'."""
    d = name.split("_")[3]
    return f"{d[:4]}-{d[4:6]}-{d[6:8]}"


def cmd_search(_):
    s = stack()
    pairs = make_pairs(s)
    print(f"bursts {BURSTS}: {len(s)} dates, {min(s)} … {max(s)}, {len(pairs)} pairs")


def cmd_submit(args):
    s = stack()
    api = hyp3()
    done = submitted_pairs(api)
    todo = [p for p in make_pairs(s) if p not in done]
    print(f"{len(done)} pairs already submitted, {len(todo)} to submit, credits left: {api.check_credits()}")
    if args.dry_run or not todo:
        return
    jobs = [api.prepare_insar_isce_multi_burst_job(s[a], s[b], name=JOB_NAME, apply_water_mask=True, looks=LOOKS)
            for a, b in todo]
    for i in range(0, len(jobs), 100):  # HyP3 caps one request at a few hundred jobs
        api.submit_prepared_jobs(jobs[i:i + 100])
    print(f"submitted {len(jobs)} jobs")


def cmd_download(_):
    api = hyp3()
    batch = api.find_jobs(name=JOB_NAME)
    WORK.mkdir(parents=True, exist_ok=True)
    ready = [j for j in batch if j.succeeded() and not j.expired()]
    print(f"{len(batch)} jobs: {len(ready)} ready, "
          f"{sum(j.running() for j in batch)} running, {sum(j.failed() for j in batch)} failed")
    for j in ready:
        name = j.files[0]["filename"].removesuffix(".zip")
        if (WORK / name).exists():
            continue
        zpath = j.download_files(WORK)[0]
        with zipfile.ZipFile(zpath) as z:
            for m in z.namelist():
                if m.endswith(KEEP):
                    z.extract(m, WORK)
        zpath.unlink()
    size = sum(f.stat().st_size for f in WORK.rglob("*") if f.is_file())
    print(f"{WORK}: {size / 1e9:.2f} GB")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("search").set_defaults(fn=cmd_search)
    p = sub.add_parser("submit")
    p.add_argument("--dry-run", action="store_true")
    p.set_defaults(fn=cmd_submit)
    sub.add_parser("download").set_defaults(fn=cmd_download)
    args = ap.parse_args()
    sys.exit(args.fn(args))
