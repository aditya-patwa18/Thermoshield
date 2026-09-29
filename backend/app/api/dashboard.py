from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from ..services.dashboard_service import dashboard_service
from ..services.location_service import location_service

router = APIRouter(tags=["Command Dashboard"])

@router.get("/dashboard/location/{location_id}", summary="Get Full Unified Dashboard Intelligence by Location ID")
async def get_dashboard_by_location_slug(location_id: str):
    """
    Returns the complete synthesized dashboard intelligence payload for a monitored city.
    Section 47 schema specification.
    """
    loc = location_service.get_location_by_id(location_id)
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found in predefined registry.")
    return await dashboard_service.get_dashboard_data(lat=loc["latitude"], lon=loc["longitude"], location_id=location_id)

@router.get("/dashboard/{location_id}", summary="Get Dashboard Data by Location ID (Alias)")
async def get_dashboard_alias(location_id: str):
    return await get_dashboard_by_location_slug(location_id)

@router.get("/dashboard", summary="Get Dashboard Data by Coordinates or Query")
async def get_dashboard_coords(
    lat: float = Query(19.0760, ge=-90, le=90, description="Latitude"),
    lon: float = Query(72.8777, ge=-180, le=180, description="Longitude"),
    name: Optional[str] = Query(None, description="Optional custom location label")
):
    """
    Returns complete dashboard intelligence dynamically for ANY global coordinates.
    """
    return await dashboard_service.get_dashboard_data(lat=lat, lon=lon, custom_name=name)
