# Artt by Noor — Website + Upload Dashboard

## What's in here

- `index.html` — home page
- `gallery.html` — gallery hub (links to the 4 category pages)
- `gallery-crochet.html`, `gallery-painting.html`, `gallery-crafts.html`, `gallery-mehndi.html` — one dedicated page per section, each showing sample pieces
- `booking.html` — mehndi booking page
- `dashboard.html` — private page to upload/delete pictures (find it at `yoursite.com/dashboard.html` — it isn't linked in the nav on purpose)
- `css/`, `js/` — shared styles and scripts
- `api/` — three small serverless functions that make the dashboard actually work: `upload.js`, `images.js`, `delete.js`

The gallery pages call `/api/images` on load. If nothing has been uploaded yet (or the API isn't set up), they automatically show the built-in sample pieces instead — so the site never looks broken.

## Deploy to Vercel (one-time setup)

1. **Push this folder to a GitHub repo**, then import it into Vercel (New Project → import repo). Or install the Vercel CLI and run `vercel` from inside this folder.

2. **Add Blob storage** (this is where uploaded pictures are actually stored):
   - In your Vercel project → **Storage** tab → **Create Database** → choose **Blob**.
   - Connect it to this project. Vercel automatically adds the `BLOB_READ_WRITE_TOKEN` environment variable for you — no copying/pasting needed.

3. **Set your dashboard passcode**:
   - Project → **Settings** → **Environment Variables**.
   - Add a variable named `DASHBOARD_PASSCODE` with whatever password you want to use to log into the dashboard.
   - Redeploy after adding it (Vercel will prompt you, or run `vercel --prod` again).

4. **Install dependencies**: Vercel does this automatically from `package.json` during deploy (it installs `@vercel/blob`). Nothing for you to do locally unless you want to test on your own machine first (`npm install`, then `vercel dev`).

That's it — once deployed, go to `yoursite.com/dashboard.html`, enter your passcode, and start uploading. Pictures show up on the matching gallery page immediately (no rebuild needed).

## Notes

- The dashboard passcode is basic protection, not bank-grade security — good enough to stop random visitors from messing with your gallery, since the URL isn't linked anywhere. Don't reuse a password you use elsewhere.
- Keep individual pictures under ~4MB (phone photos are usually fine; screenshots of screenshots less so).
- To change a category's sample/fallback pieces (shown before you've uploaded anything), edit the `fallback: [...]` list near the bottom of that category's HTML file.
