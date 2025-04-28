# SaleOrderForecast

## Project Structure

- `index.html`, `style.css`, `script.js`, `data.js`, `mockData.js`: Frontend files
- `api/getSheetData.js`: Serverless backend function (Vercel API route)
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
