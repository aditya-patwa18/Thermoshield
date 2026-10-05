# Thermoshield

ThermalShield is a heat-health risk monitoring prototype with a React/Vite frontend and a FastAPI backend.

## Local configuration

Copy the backend and frontend `.env.example` files to `.env` in their respective folders, then add your local credentials. Real `.env` files are excluded from Git.

## Run locally

Start the API from `backend` with `python -m uvicorn app.main:app --reload --port 8000`.

Start the web app from `frontend` with `npm install` followed by `npm run dev`.

## SMS alerts on a Twilio trial account

Twilio trial accounts cannot send custom text. They deliver only Twilio's preset sample messages, and only to phone numbers verified in the Twilio Console. On a trial account the SMS channel therefore sends the sample named by `TWILIO_TRIAL_TEMPLATE` (default `sms_internal_alerts`) instead of the alert text, and the alert dialog says so before you send. Upgrade the Twilio account and set `TWILIO_PHONE_NUMBER` to a number you own to send the real alert.

## 3D heat overview

The overview page renders heat stress for every monitored city with Three.js (`frontend/src/three/heatField.js`), fed by `GET /api/heat-field`.

## Public deployment

The repository includes a Render Blueprint (`render.yaml`) that deploys the frontend as a public static site and the FastAPI backend as a public web service. To deploy, push this repository to GitHub, sign in to [Render](https://render.com), choose **New > Blueprint**, select this repository, and deploy the `render.yaml` configuration. After the services are created, enter the optional secret environment variables in the `thermalshield-api` service's Environment settings; set `VITE_GOOGLE_MAPS_API_KEY` in the `thermalshield-web` service and trigger a redeploy because Vite embeds it at build time. Google Maps browser keys are public, so restrict that key to the deployed site and the required Maps APIs. Render builds and redeploys both services from GitHub; your computer does not need to keep either server running.

The API service supports `GOOGLE_MAPS_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_FROM`, `TWILIO_TRIAL_TEMPLATE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM`. Twilio and SMTP remain in demo/preview mode until their required credentials and sender details are configured. The frontend uses `VITE_GOOGLE_MAPS_API_KEY` for the browser map. Open-Meteo is the default weather provider and does not require a key. Do not put secrets in the repository. The free backend plan may spin down after inactivity, so the first request after a quiet period can take up to a minute.
