from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api import api_router

app = FastAPI(
    title="ThermalShield Intelligence API",
    description=(
        "**Extreme Heatwave Early Warning & Human Thermal Stress Intelligence Platform**\n\n"
        "Translates raw meteorological forecasts into human thermal stress, population vulnerability, "
        "and actionable heat-health risk directives for municipal corporations, public health departments, "
        "and emergency response teams.\n\n"
        "**Methodological Note**: Uses a deterministic biometeorological rule-based engine "
        "incorporating Heat Index (NWS), Wet Bulb (Stull), WBGT (ISO 7243), UTCI (Bröde et al.), and custom HTSI. "
        "Health-risk simulations are prototype advisory indicators and not clinically validated mortality predictions."
    ),
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows frontend in dev or production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers under /api
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/", summary="Root Health Check")
async def root():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": "From Weather Forecasts to Human Health Risk",
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/api/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
