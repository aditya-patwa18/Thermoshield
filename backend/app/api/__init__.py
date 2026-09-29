from fastapi import APIRouter
from .health import router as health_router
from .locations import router as locations_router
from .weather import router as weather_router
from .thermal import router as thermal_router
from .vulnerability import router as vulnerability_router
from .risk import router as risk_router
from .infrastructure import router as infrastructure_router
from .alerts import router as alerts_router
from .scenario import router as scenario_router
from .dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(locations_router)
api_router.include_router(weather_router)
api_router.include_router(thermal_router)
api_router.include_router(vulnerability_router)
api_router.include_router(risk_router)
api_router.include_router(infrastructure_router)
api_router.include_router(alerts_router)
api_router.include_router(scenario_router)
api_router.include_router(dashboard_router)

__all__ = ["api_router"]
