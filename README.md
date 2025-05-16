# Sales Order Forecast Dashboard

## Project Structure

### Frontend
- `index.html`: Main application entry point
- `login.html`: Authentication page

### CSS (Modular Structure)
- `css/variables.css`: CSS variables and theme settings
- `css/layout.css`: Base layout styles
- `css/components.css`: UI component styles
- `css/table.css`: Table-specific styles
- `css/filters.css`: Filter section styles
- `css/charts.css`: Chart-specific styles
- `css/utilities.css`: Utility classes
- `css/modal.css`: Modal component styles
- `css/dashboardCustomization.css`: Dashboard customization features
- `css/dealForm.css`: Deal form styles
- `css/historyTracker.css`: History tracking functionality

### JavaScript (Modular Structure)
- `js/index.js`: Main JavaScript entry point
- `js/core/app.js`: Core application logic
- `js/auth/auth.js`: Authentication handling
- `js/utils/logger.js`: Logging utilities
- `js/utils/uiHelpers.js`: UI helper functions
- `js/utils/dataFetch.js`: Data fetching and caching
- `js/components/table.js`: Table component
- `js/components/filters.js`: Filters component
- `js/charts/charts.js`: Charts functionality

### Backend
- `api/getSheetData.js`: Data retrieval API
- `api/auth/`: Authentication endpoints
- `server.js`: Local development server
- `.env`: Local environment variables (not committed)

## Local Development

1. Install dependencies:
   ```sh
   npm install
   ```
2. Create a `.env` file in the project root with:
   ```env
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_SHEET_ID=your_google_sheet_id
   SHEET_NAME=Sheet1
   SHEET_RANGE=A2:M
   ```
3. Start local dev server:
   ```sh
   npx vercel dev
   ```
   The app will be available at http://localhost:3000

## Deploying to Vercel

1. Push your code to GitHub/GitLab/Bitbucket.
2. Import the repo into Vercel.
3. In the Vercel dashboard, add the same environment variables (`GOOGLE_API_KEY`, `GOOGLE_SHEET_ID`, etc.) in Project Settings → Environment Variables.
4. Deploy!

## Notes

- Do not commit `.env` or sensitive keys to git.
- The old `dashboard-backend/` folder is no longer needed and can be deleted.
- All backend logic now lives in `api/getSheetData.js` at the project root for Vercel compatibility.
