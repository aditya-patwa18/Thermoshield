import json
import logging
from typing import List, Dict, Any, Optional
from ..config import DATA_DIR
from .geospatial_service import haversine_distance_km

logger = logging.getLogger(__name__)

class LocationService:
    def __init__(self):
        self.locations: List[Dict[str, Any]] = self._load_locations()
        self._loc_by_id: Dict[str, Dict[str, Any]] = {loc["id"]: loc for loc in self.locations}

    def _load_locations(self) -> List[Dict[str, Any]]:
        loc_file = DATA_DIR / "india_locations.json"
        if loc_file.exists():
            try:
                with open(loc_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load india_locations.json: {e}")
        return []

    def get_all_locations(self) -> List[Dict[str, Any]]:
        return self.locations

    def get_location_by_id(self, location_id: str) -> Optional[Dict[str, Any]]:
        return self._loc_by_id.get(location_id.lower().strip())

    def find_closest_location(self, lat: float, lon: float, max_distance_km: float = 60.0) -> Optional[Dict[str, Any]]:
        """
        Finds the closest predefined location within max_distance_km.
        """
        best_match = None
        min_dist = float("inf")
        for loc in self.locations:
            d = haversine_distance_km(lat, lon, loc["latitude"], loc["longitude"])
            if d < min_dist:
                min_dist = d
                best_match = loc
        if min_dist <= max_distance_km:
            match_copy = dict(best_match)
            match_copy["distance_km"] = min_dist
            return match_copy
        return None

    def is_in_india_bounds(self, lat: float, lon: float) -> bool:
        """
        Checks broad bounding box for the Indian subcontinent.
        """
        return 6.0 <= lat <= 37.5 and 68.0 <= lon <= 97.5

location_service = LocationService()
