import pytest
from app.engine.thermal.heat_index import calculate_heat_index
from app.engine.thermal.wet_bulb import calculate_wet_bulb
from app.engine.thermal.wbgt import calculate_wbgt
from app.engine.thermal.utci import calculate_utci
from app.engine.thermal.htsi import calculate_htsi

def test_heat_index_moderate():
    res = calculate_heat_index(32.0, 50.0)
    assert "value" in res
    assert res["unit"] == "°C"
    assert res["value"] >= 32.0

def test_heat_index_extreme():
    res = calculate_heat_index(42.0, 65.0)
    assert res["value"] > 50.0
    assert res["category"] in ["Danger", "Extreme Danger"]

def test_wet_bulb_bounds():
    res = calculate_wet_bulb(35.0, 60.0)
    assert 20.0 < res["value"] < 35.0
    assert "tooltip" in res
    assert "category" in res

def test_wbgt_work_rest():
    res_low = calculate_wbgt(24.0, 40.0, 2.0, 200.0)
    assert res_low["category"] == "Low"

    res_extreme = calculate_wbgt(42.0, 75.0, 1.0, 800.0)
    assert res_extreme["category"] in ["Very High", "Extreme"]
    assert "Cease" in res_extreme["work_rest_ratio"] or "20 min" in res_extreme["work_rest_ratio"]

def test_utci_stress_levels():
    res = calculate_utci(38.0, 65.0, 1.5, 700.0)
    assert res["value"] > 35.0
    assert "stress_level" in res
    assert "physiological_strain" in res

def test_htsi_scale_and_drivers():
    res = calculate_htsi(40.0, 70.0, 1.0, 800.0)
    assert 0.0 <= res["score"] <= 100.0
    assert res["category"] in ["Very High", "Extreme"]
    assert len(res["primary_drivers"]) > 0
    assert "Relative humidity" in " ".join(res["primary_drivers"]) or "temperature" in " ".join(res["primary_drivers"]).lower()
