# RLS test plan

1. As anon, SELECT people where status=draft — expect 0 rows.
2. As anon, INSERT into people — expect deny.
3. As anon, INSERT into inquiries — expect allow.
4. As anon, SELECT inquiries — expect deny.
5. As authenticated non-staff, UPDATE profiles.role to admin — expect deny.
6. As staff, INSERT published article — expect allow and public page shows it.
