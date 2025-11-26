# Weather API Setup (OpenWeather)

This project requires a server-side OpenWeather API key to enable the weather widget.

1. Obtain an API key from OpenWeather: https://openweathermap.org/api

2. Add the key to your deployment as a server-only environment variable:
   - Name: `OPENWEATHER_API_KEY`
   - Value: (your OpenWeather API key)

   Example for local development (create a `.env.local` in `web/`):
   OPENWEATHER_API_KEY=your_real_api_key_here

   Note: Do NOT commit `.env.local` to source control.

3. If deploying to Vercel:
   - Go to your Project Settings → Environment Variables
   - Add `OPENWEATHER_API_KEY` as an Environment Variable for Preview/Production as needed
   - Redeploy the app after adding the variable.

4. Quick verification:
   - Start dev server: `cd web && npm run dev`
   - Run: `curl -i "http://localhost:3000/api/weather?lat=52.3676&lon=4.9041"`
   - Successful response will be 200 with weather JSON. If it returns 503, ensure the env var is set.

5. Optional (temporary) DEV fallback:
   - You may set `NEXT_PUBLIC_OPENWEATHER_API_KEY` for local testing, but this exposes the key to the browser and is not recommended for production.
