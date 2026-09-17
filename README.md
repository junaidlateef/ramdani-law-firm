# Ramdani Law Firm

Public website and staff CMS for Ramdani Law Firm / Law Chamber (Dera Ghazi Khan, Pakistan).

- GitHub: this private repository
- Database: dedicated Supabase project `ramdani-law-firm`
- Hosting target: Vercel (connect this repo only)

## Local

Serve the folder over HTTP (required for module-free relative `/js` paths):

```bash
python3 -m http.server 8080
```

Open http://localhost:8080/

## Staff access

Sign up at `/admin/`, then an existing administrator must set `profiles.role` to `admin` or `editor` and `status` to `active`.

## Isolation

This project is independent. Do not point it at any other organisation's database or deployment.
