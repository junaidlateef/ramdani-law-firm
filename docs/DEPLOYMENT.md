# DEPLOYMENT

Target: Vercel, connected to `junaidlateef/ramdani-law-firm` only.

Production URL: https://ramdani-law-firm.vercel.app/

Do not attach this repo to any other project's Vercel project.

Environment (optional; public values are also in `js/config.js`):

- RAMDANI_SUPABASE_URL
- RAMDANI_SUPABASE_ANON_KEY

Auth redirect URLs to add in the Ramdani Supabase project:

- Site URL: `https://ramdani-law-firm.vercel.app`
- Redirect: `https://ramdani-law-firm.vercel.app/admin/`
