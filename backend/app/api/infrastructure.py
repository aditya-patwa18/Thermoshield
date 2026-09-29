from fastapi import APIRouter, Query
from typing import Optional
from ..services.geospatial_service import geospatial_service

router = APIRouter(tags=["Civic Infrastructure"])

@router.get("/infrastructure", summary="List All Monitored Civic Heat Infrastructure")
async def get_all_infrastructure(city_id: Optional[str] = Query(None)):
    infra = geospatial_service.infrastructure
    if city_id:
        c_id = city_id.lower().strip()
        return {
            "cooling_centers": [c for c in infra.get("cooling_centers", []) if c.get("city_id") == c_id],
            "hospitals": [h for h in infra.get("hospitals", []) if h.get("city_id") == c_id],
            "water_points": [w for w in infra.get("water_points", []) if w.get("city_id") == c_id]
        }
    return infra

@router.get("/cooling-centers", summary="List Designated Public Cooling Centers")
async def get_cooling_centers(city_id: Optional[str] = Query(None)):
    ccs = geospatial_service.infrastructure.get("cooling_centers", [])
    if city_id:
        return [c for c in ccs if c.get("city_id") == city_id.lower().strip()]
    return ccs

@router.get("/hospitals", summary="List Designated Emergency Healthcare Facilities")
async def get_hospitals(city_id: Optional[str] = Query(None)):
    hosps = geospatial_service.infrastructure.get("hospitals", [])
    if city_id:
        return [h for h in hosps if h.get("city_id") == city_id.lower().strip()]
    return hosps

@router.get("/infrastructure/nearest", summary="Find Nearest Facilities from Coordinates")
async def get_nearest(
    lat: float = Query(19.0760, ge=-90, le=90, description="Latitude"),
    lon: float = Query(72.8777, ge=-180, le=180, description="Longitude"),
    limit: int = Query(3, ge=1, le=10, description="Max facilities per category")
):
    return geospatial_service.get_nearest_facilities(lat, lon, max_items=limit)
