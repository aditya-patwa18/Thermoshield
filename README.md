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

The repository includes a Render Blueprint (`render.yaml`) that deploys the frontend as a public static site and the FastAPI backend as a public web service. To deploy, push this repository to GitHub, sign in to [Render](https://render.com), choose **New > Blueprint**, select this repository, and deploy the `render.yaml` configuration. Render builds and redeploys both services from GitHub; your computer does not need to keep either server running.

The free backend plan may spin down after inactivity, so the first request after a quiet period can take up to a minute. Add optional integrations such as Google Maps, Twilio, or SMTP as environment variables in the Render service settings; do not put their secrets in the repository.
