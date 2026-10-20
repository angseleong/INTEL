"""Kelurahan ranking on made-up points with known answers: python pipeline/export_check.py"""
import geopandas as gpd
import numpy as np
from shapely.geometry import box

from compute import ALREADY, NEVER
from export import ranking

kel = gpd.GeoDataFrame({"code": ["A", "B", "C"], "name": ["Sudah", "Nanti", "Aman"], "kecamatan": "K", "kota": "X"},
                       geometry=[box(0, 0, 1, 1)] * 3)
grid = np.repeat([0, 1, 2], 30).reshape(1, -1)  # 30 points per Kelurahan
mid = np.concatenate([np.full(30, ALREADY), np.full(30, 2035), np.full(30, NEVER)])
rob = {f"robYear{p}_{s}": mid.reshape(1, -1).copy() for p in ("Min", "", "Max") for s in ("continue", "stop")}
rob["robYearMin_continue"] = np.where(mid == 2035, 2032, mid).reshape(1, -1)
rob["robYearMax_continue"] = np.where(mid == 2035, 2039, mid).reshape(1, -1)
rob["filled"] = np.zeros((1, 90))
rows = {r["kelurahan"]: r for r in ranking(rob, np.ones((1, 90)), kel, grid, 0.64)}
assert rows["Sudah"]["separuh_rob_paling_cepat"] == "sudah" and rows["Sudah"]["persen_bawah_pasang_2026"] == 100
assert (rows["Nanti"]["separuh_rob_paling_cepat"], rows["Nanti"]["separuh_rob_paling_lambat"]) == (2032, 2039)
assert rows["Nanti"]["persen_bawah_pasang_2026"] == 0 and rows["Nanti"]["persen_bawah_pasang_2050_lanjut"] == 100
assert rows["Aman"]["separuh_rob_paling_cepat"] == ">2050" and rows["Aman"]["ha_bawah_pasang_2050_lanjut"] == 0
print("OK")
