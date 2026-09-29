from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from ..services.location_service import location_service
from ..services.geospatial_service import geospatial_service

router = APIRouter(tags=["Locations & Geospatial Wards"])

@router.get("/locations", summary="List Predefined Indian Monitored Cities")
async def list_locations():
    """
    Returns the comprehensive dataset of monitored Indian urban locations
    with population demographics, density, and civic infrastructure counts.
    """
    return location_service.get_all_locations()

@router.get("/locations/{location_id}", summary="Get Single Monitored Location")
async def get_location(location_id: str):
    """
    Returns demographic and infrastructure profile for a specific monitored city.
    """
    loc = location_service.get_location_by_id(location_id)
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found in predefined registry.")
    return loc

@router.get("/locations/wards/mumbai", summary="Get Mumbai Prototype Ward Boundaries (GeoJSON)")
async def get_mumbai_wards():
    """
    Returns 24 administrative municipal ward boundaries for Mumbai in GeoJSON format
    with embedded ward-level demographic vulnerability indicators.
    """
    return geospatial_service.wards_geojson

@router.get("/geocode", summary="Reverse Geocode Coordinates to Nearest Monitored Location")
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Resolves a coordinate to a supported ward or nearest monitored city.
    """
    ward = geospatial_service.get_ward_for_coordinate(lat, lon)
    if ward:
        return {
            "type": "ward",
            "name": f"{ward['ward_name']} (Mumbai)",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "data": ward
        }

    closest = location_service.find_closest_location(lat, lon, max_distance_km=60.0)
    if closest:
        return {
            "type": "city",
            "name": f"{closest['city']}, {closest['state']}",
            "city": closest["city"],
            "state": closest["state"],
            "country": closest["country"],
            "distance_km": closest["distance_km"],
            "data": closest
        }

    return {
        "type": "global_coordinate",
        "name": f"Global Point ({lat:.4f}, {lon:.4f})",
        "latitude": lat,
        "longitude": lon,
        "is_indian_covered": location_service.is_in_india_bounds(lat, lon),
        "note": "Global coordinates supported for live thermal stress analysis."
    }
