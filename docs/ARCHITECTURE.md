# ARCHITECTURE

Static HTML/CSS/JS on Vercel talking to a dedicated Supabase project.

```
Browser
  pages/*.html + index.html
  css/
  js/config.js (public URL + anon key only)
  js/supabase-client.js
  js/auth.js / api.js / admin.js
        |
        v
Supabase project ramdani-law-firm (ref glyynqeksiqrssrvshba)
  Auth (email, Google, Facebook, GitHub)
  Postgres + RLS
  Storage (not used in v1)
```

Public visitors read `status = published` rows only. Staff use `/admin/` after `profiles.role` is `admin` or `editor` and `status = active`.

Private client/case tables are intentionally absent.
