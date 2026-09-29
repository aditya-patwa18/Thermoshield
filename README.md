# Thermoshield

ThermalShield is a heat-health risk monitoring prototype with a React/Vite frontend and a FastAPI backend.

## Local configuration

Copy the backend and frontend `.env.example` files to `.env` in their respective folders, then add your local credentials. Real `.env` files are excluded from Git.

## Run locally

Start the API from `backend` with `python -m uvicorn app.main:app --reload --port 8000`.

Start the web app from `frontend` with `npm install` followed by `npm run dev`.
