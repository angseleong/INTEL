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
print("fetch_insar ok")
