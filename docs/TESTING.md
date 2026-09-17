# TESTING

Automated: `tests/rls_plan.md` plus browser checklist.

Must verify after deploy:

- Public pages load
- Unpublished rows do not appear
- Contact/consultation insert works
- Anonymous user cannot read inquiries
- Unsigned visitor cannot write people/articles
- Staff login (email) works after role promotion
- Logout clears admin UI
- Google/Facebook/GitHub buttons start OAuth (providers must be enabled in this project)
