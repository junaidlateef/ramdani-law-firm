# DEPLOYMENT

Target: Vercel, connected to `junaidlateef/ramdani-law-firm` only.

Do not attach this repo to any other project's Vercel project.

Environment (optional; public values are also in `js/config.js`):

- RAMDANI_SUPABASE_URL
- RAMDANI_SUPABASE_ANON_KEY

Auth redirect URLs to add in the new Supabase project:

- Site URL: the Vercel production URL
- Redirect: `https://<vercel-domain>/admin/`
