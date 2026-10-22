# ATLAS web (step 2)

    cd web && npm install && npm run dev      # http://localhost:5173

Backend must be running on :8002 (`uvicorn backend.main:app --port 8002`); Vite proxies `/api` to it.
Demo access code: `atlas-demo` (override with VITE_DEMO_PASSCODE). Not real auth.
