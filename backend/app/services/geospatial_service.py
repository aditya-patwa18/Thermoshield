import json
import math
import logging
from typing import Dict, Any, List, Optional, Tuple
from shapely.geometry import Point, shape
from ..config import DATA_DIR

logger = logging.getLogger(__name__)

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great circle distance between two points on Earth in kilometers.
    """
    R = 6371.0  # Earth's radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

class GeospatialService:
    def __init__(self):
        self.wards_geojson = self._load_wards()
        self.infrastructure = self._load_infrastructure()
        self._parsed_wards: List[Tuple[Dict[str, Any], Any]] = []
        self._init_shapely_geometries()

    def _load_wards(self) -> Dict[str, Any]:
        ward_file = DATA_DIR / "wards.geojson"
        if ward_file.exists():
            try:
                with open(ward_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load wards.geojson: {e}")
        return {"type": "FeatureCollection", "features": []}

    def _load_infrastructure(self) -> Dict[str, Any]:
        infra_file = DATA_DIR / "infrastructure.json"
        if infra_file.exists():
            try:
                with open(infra_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load infrastructure.json: {e}")
        return {"cooling_centers": [], "hospitals": [], "water_points": []}

    def _init_shapely_geometries(self):
        features = self.wards_geojson.get("features", [])
        for feat in features:
            geom_data = feat.get("geometry")
            if geom_data:
                try:
                    geom_shape = shape(geom_data)
                    self._parsed_wards.append((feat.get("properties", {}), geom_shape))
                except Exception as e:
                    logger.warning(f"Error parsing geometry for ward {feat.get('properties', {}).get('ward_id')}: {e}")

    def get_ward_for_coordinate(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Point-in-polygon resolution to find which municipal ward a coordinate falls within.
        Note: GeoJSON uses [longitude, latitude] coordinates.
        """
        pt = Point(lon, lat)
        for props, geom in self._parsed_wards:
            if geom.contains(pt):
                return props
        return None

    def get_nearest_facilities(self, lat: float, lon: float, max_items: int = 3) -> Dict[str, List[Dict[str, Any]]]:
        """
        Calculates nearest cooling centers, hospitals, and water points with distance in km and meters.
        """
        res = {
            "cooling_centers": [],
            "hospitals": [],
            "water_points": []
        }

        # Cooling centers
        cc_list = []
        for cc in self.infrastructure.get("cooling_centers", []):
            d = haversine_distance_km(lat, lon, cc["latitude"], cc["longitude"])
            item = dict(cc)
            item["distance_km"] = d
            item["distance_m"] = int(d * 1000)
            cc_list.append(item)
        cc_list.sort(key=lambda x: x["distance_km"])
        res["cooling_centers"] = cc_list[:max_items]

        # Hospitals
        hosp_list = []
        for h in self.infrastructure.get("hospitals", []):
            d = haversine_distance_km(lat, lon, h["latitude"], h["longitude"])
            item = dict(h)
            item["distance_km"] = d
            item["distance_m"] = int(d * 1000)
            hosp_list.append(item)
        hosp_list.sort(key=lambda x: x["distance_km"])
        res["hospitals"] = hosp_list[:max_items]

        # Water points
        wp_list = []
        for wp in self.infrastructure.get("water_points", []):
            d = haversine_distance_km(lat, lon, wp["latitude"], wp["longitude"])
            item = dict(wp)
            item["distance_km"] = d
            item["distance_m"] = int(d * 1000)
            wp_list.append(item)
        wp_list.sort(key=lambda x: x["distance_km"])
        res["water_points"] = wp_list[:max_items]

        return res

geospatial_service = GeospatialService()
