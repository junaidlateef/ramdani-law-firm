# SECURITY

- RLS on every application table.
- Anon can SELECT only `published` public content.
- Anon can INSERT `inquiries` only (honeypot field ignored server-side by not being a column).
- Staff writes require `is_staff()` (`profiles.role` in admin/editor and `status = active`).
- Inquiries are staff-only to read/update.
- Profiles cannot be self-promoted to admin via the client (`role`/`status` updates blocked for non-admin).
- Frontend holds only the publishable anon key.
- OAuth client secrets belong in the Supabase dashboard.
- First staff user must be promoted in the SQL editor: `update public.profiles set role='admin', status='active' where id = '<auth user uuid>';`
