"""Laju Penurunan, step 1: Sentinel-1 burst InSAR pairs processed by ASF HyP3.

    python pipeline/fetch_insar.py search              # stack summary, no login needed
    python pipeline/fetch_insar.py submit [--dry-run]  # send missing pairs to HyP3
    python pipeline/fetch_insar.py status              # how many pairs HyP3 has finished
    python pipeline/fetch_insar.py download            # fetch finished pairs into pipeline/work/hyp3/
    python pipeline/fetch_insar.py timeseries          # MintPy -> pipeline/work/subsidence_rate.tif (needs GDAL + mintpy)

Login comes from EARTHDATA_USERNAME / EARTHDATA_PASSWORD, or ~/.netrc.
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
MINTPY = WORK.parent / "mintpy"
OUT = WORK.parent / "subsidence_rate.tif"
# Pixels with temporal coherence below 0.5 are masked (MintPy default 0.7 kept only 10% of pixels).
# Rates are relative to one reference pixel, so it must sit on ground that is not sinking.
# MintPy picks the most coherent pixel inside this box: Semarang's southern hills (Banyumanik, Tembalang).
# ponytail: assumed stable from published maps (subsidence is concentrated in the north). Confirm with GNSS later.
STABLE_BOX = (-7.10, 110.38, -7.04, 110.47)  # lat_min, lon_min, lat_max, lon_max
STABLE_MIN_HEIGHT = 100  # m, keeps the pick off the coastal plain


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


def job_counts(batch):
    return {"total": len(batch), "ready": sum(j.succeeded() and not j.expired() for j in batch),
            "running": sum(j.running() for j in batch), "failed": sum(j.failed() for j in batch)}


def cmd_status(_):
    c = job_counts(hyp3().find_jobs(name=JOB_NAME))
    print(f"{c['total']} jobs: {c['ready']} ready, {c['running']} running, {c['failed']} failed")
    if os.environ.get("GITHUB_OUTPUT"):  # lets the workflow open a "done" issue
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"done={str(c['total'] > 0 and c['running'] == 0).lower()}\n")
            f.write(f"summary={c['ready']} siap, {c['failed']} gagal dari {c['total']} pasangan\n")


def cmd_download(_):
    api = hyp3()
    batch = api.find_jobs(name=JOB_NAME)
    WORK.mkdir(parents=True, exist_ok=True)
    ready = [j for j in batch if j.succeeded() and not j.expired()]
    c = job_counts(batch)
    print(f"{c['total']} jobs: {c['ready']} ready, {c['running']} running, {c['failed']} failed")
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


def clip_to_overlap():
    """MintPy needs every layer on the same grid: cut all products to their common overlap."""
    import rasterio
    from rasterio.windows import from_bounds

    files = sorted(f for f in WORK.glob("*/*.tif") if not f.stem.endswith("_clip"))
    bounds = []
    for f in files:
        with rasterio.open(f) as r:
            bounds.append(r.bounds)
    box = (max(b.left for b in bounds), max(b.bottom for b in bounds),
           min(b.right for b in bounds), min(b.top for b in bounds))
    for f in files:
        out = f.with_name(f.stem + "_clip.tif")
        if out.exists():
            continue
        with rasterio.open(f) as src:
            w = from_bounds(*box, src.transform).round_offsets().round_lengths()
            prof = src.profile | {"width": w.width, "height": w.height, "transform": src.window_transform(w)}
            with rasterio.open(out, "w", **prof) as dst:
                dst.write(src.read(window=w))


def write_reference_mask():
    """refMask.h5: pixels inside STABLE_BOX and above STABLE_MIN_HEIGHT, where MintPy may put the reference."""
    import numpy as np
    from mintpy.utils import readfile, utils as ut, writefile

    height, atr = readfile.read(str(MINTPY / "inputs/geometryGeo.h5"), datasetName="height")
    coord = ut.coordinate(atr)
    lat0, lon0, lat1, lon1 = STABLE_BOX
    (y_a, x_a), (y_b, x_b) = (coord.geo2radar(la, lo)[:2] for la, lo in ((lat1, lon0), (lat0, lon1)))
    mask = np.zeros(height.shape, bool)
    mask[max(min(y_a, y_b), 0):max(y_a, y_b) + 1, max(min(x_a, x_b), 0):max(x_a, x_b) + 1] = True
    mask &= np.nan_to_num(height) > STABLE_MIN_HEIGHT
    if not mask.any():
        sys.exit(f"STABLE_BOX {STABLE_BOX} has no pixel above {STABLE_MIN_HEIGHT} m inside the InSAR frame")
    writefile.write({"mask": mask}, out_file=str(MINTPY / "refMask.h5"), metadata=atr | {"FILE_TYPE": "mask"})
    print(f"refMask.h5: {mask.sum()} candidate reference pixels")


def stable_offset(rate, transform, crs):
    """Median Laju Penurunan inside STABLE_BOX. MintPy references one pixel, and on run 2 (19 Oct 2026)
    that pixel itself was sinking, which shifted every rate by −4.3 cm/tahun. Subtracting this median makes
    the stable hills read 0 on average instead."""
    import numpy as np
    import rasterio.transform
    from rasterio.warp import transform as reproject_xy

    rows, cols = np.indices(rate.shape)
    lon, lat = (np.array(v).reshape(rate.shape) for v in
                reproject_xy(crs, "EPSG:4326", *rasterio.transform.xy(transform, rows.ravel(), cols.ravel())))
    lat0, lon0, lat1, lon1 = STABLE_BOX
    box = (lat >= lat0) & (lat <= lat1) & (lon >= lon0) & (lon <= lon1) & np.isfinite(rate)
    if box.sum() < 100:
        sys.exit(f"only {box.sum()} measured pixels in STABLE_BOX, cannot re-reference")
    return float(np.median(rate[box]))


def cmd_timeseries(_):
    """HyP3 pairs -> MintPy small-baseline time series -> Laju Penurunan GeoTIFF (cm/tahun, positif = turun)."""
    import subprocess

    import numpy as np
    import rasterio

    clip_to_overlap()
    MINTPY.mkdir(parents=True, exist_ok=True)
    geo = sorted(WORK.glob("*/"))[0]  # geometry layers are the same in every product
    (MINTPY / "intel.cfg").write_text(f"""
mintpy.load.processor      = hyp3
mintpy.load.unwFile        = {WORK}/*/*_unw_phase_clip.tif
mintpy.load.corFile        = {WORK}/*/*_corr_clip.tif
mintpy.load.connCompFile   = {WORK}/*/*_conncomp_clip.tif
mintpy.load.demFile        = {geo}/*_dem_clip.tif
mintpy.load.incAngleFile   = {geo}/*_lv_theta_clip.tif
mintpy.load.azAngleFile    = {geo}/*_lv_phi_clip.tif
mintpy.load.waterMaskFile  = {geo}/*_water_mask_clip.tif
mintpy.reference.lalo      = auto
mintpy.reference.maskFile  = refMask.h5
mintpy.reference.minCoherence = 0.5
mintpy.troposphericDelay.method = no
mintpy.deramp              = no
mintpy.topographicResidual = yes
mintpy.networkInversion.minTempCoh = 0.5
""")
    subprocess.run(["smallbaselineApp.py", "intel.cfg", "--end", "load_data"], cwd=MINTPY, check=True)
    write_reference_mask()
    subprocess.run(["smallbaselineApp.py", "intel.cfg", "--start", "modify_network"], cwd=MINTPY, check=True)
    for src, dset, out in [("velocity.h5", "velocity", "vel.tif"), ("velocity.h5", "velocityStd", "std.tif"),
                           ("inputs/geometryGeo.h5", "incidenceAngle", "inc.tif"), ("maskTempCoh.h5", "mask", "mask.tif")]:
        subprocess.run(["save_gdal.py", src, "-d", dset, "-o", out], cwd=MINTPY, check=True)

    read = lambda n: rasterio.open(MINTPY / n).read(1).astype("float32")
    cos_inc = np.cos(np.radians(read("inc.tif")))
    # MintPy line-of-sight velocity is m/yr, positive toward the satellite. Read as purely vertical (see BURSTS).
    rate = -read("vel.tif") / cos_inc * 100
    std = read("std.tif") / cos_inc * 100
    rate[read("mask.tif") == 0] = np.nan
    std[np.isnan(rate)] = np.nan
    with rasterio.open(MINTPY / "vel.tif") as r:
        prof = r.profile | {"count": 2, "dtype": "float32", "nodata": np.nan}
    offset = stable_offset(rate, prof["transform"], prof["crs"])
    rate -= offset
    print(f"re-referenced to STABLE_BOX median: {offset:+.2f} cm/tahun removed")
    with rasterio.open(OUT, "w", **prof) as dst:
        dst.write(np.stack([rate, std]))
        dst.set_band_description(1, "subsidence_rate_cm_per_year")
        dst.set_band_description(2, "subsidence_rate_std_cm_per_year")
    print(f"{OUT}: median {np.nanmedian(rate):.1f} cm/tahun, p95 {np.nanpercentile(rate, 95):.1f} cm/tahun, "
          f"{np.isfinite(rate).mean():.0%} piksel terukur")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("search").set_defaults(fn=cmd_search)
    p = sub.add_parser("submit")
    p.add_argument("--dry-run", action="store_true")
    p.set_defaults(fn=cmd_submit)
    sub.add_parser("status").set_defaults(fn=cmd_status)
    sub.add_parser("download").set_defaults(fn=cmd_download)
    sub.add_parser("timeseries").set_defaults(fn=cmd_timeseries)
    args = ap.parse_args()
    sys.exit(args.fn(args))
