# STATUS — Ramdani Law Firm

Last verified: 2026-09-17  
Repo: `junaidlateef/ramdani-law-firm` (`main` @ `5b3fdd97`)  
Database: Supabase project `ramdani-law-firm` (`glyynqeksiqrssrvshba`) only  
Not used: `shaoorplatform`, Supabase `aerbvhslbdstmmrbvwvo`

This is the **public website + staff CMS**. A private client/case system is **out of scope** until separately commissioned.

---

## Done

| Area | Status |
|---|---|
| Private GitHub repo | Done |
| Dedicated Supabase project + empty-then-Ramdani schema | Done |
| Public pages: Home, About, People, Practice Areas, Legal Services, Representative Matters, Insights, News, Resources, Careers, Contact, Consultation | Done |
| EN / Urdu UI strings | Done |
| Staff CMS at `/admin/` (role-gated) | Done |
| Auth UI: email/password, Google, Facebook, GitHub buttons | Done (providers must be enabled in **this** Supabase project) |
| RLS: published-only public reads; anon cannot write people; anon cannot read inquiries/profiles; anon can insert inquiries | Done (API-tested) |
| Docs: PROJECT, ARCHITECTURE, DATABASE, SECURITY, DEPLOYMENT, TESTING | Done |
| Isolation from other products | Done |

## Not done (blocked on you)

| Item | Why |
|---|---|
| Vercel production URL | Vercel is not a connected app here. Connect **this** repo only. |
| First admin user | Sign up at `/admin/`, then promote in SQL on `glyynqeksiqrssrvshba` |
| OAuth secrets / provider enablement | Dashboard of the Ramdani project, not frontend |
| Domain, professional email, office address | Not provided |
| Logo #2 file | Not provided |
| Social URLs | Placeholders only |
| Advocate names, credentials, case results | Must come from the firm — not invented |
| Private client / matter / document system | Explicitly deferred |

## Blueprint items we will not build now

- React / Next.js rewrite (current stack is modular HTML/CSS/JS as specified)
- Private clients, case files, internal notes, document vault
- Speculative tables: industries, applications, media library, SEO CMS, multi-office
- Paid infra, CI beyond GitHub, staging environment
- Invented practice-area marketing copy or rankings
