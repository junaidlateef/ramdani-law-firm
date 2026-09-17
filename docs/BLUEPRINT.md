# MASTER BLUEPRINT — mapped to this repo

Source: chamber blueprint (DG Khan, Pakistan-wide, EN+Urdu).  
Rule: public site ≠ private chamber OS.

## Phase 1 — Foundation

| Item | This project |
|---|---|
| Official name | Ramdani Law Firm / Law Chamber |
| Visual identity | Professional legal styling; logo #2 not yet in `assets/` |
| EN + Urdu | `js/i18n.js` |
| Domain / email / office / advocate bios | Not in repo until you supply them |
| Practice areas | CMS table `practice_areas` (empty until staff publish) |
| Pakistan-wide + DG Khan | Copy on Home / About only; no invented court appearances |

## Phase 2 — Website architecture

Implemented as separate HTML pages under `pages/`, not one giant file.

Public IA:

```
HOME
├── ABOUT
├── OUR PEOPLE
├── PRACTICE AREAS
├── LEGAL SERVICES
├── REPRESENTATIVE MATTERS   ← not public “Cases”
├── LEGAL INSIGHTS
├── NEWS
├── RESOURCES
├── CAREERS
├── CONTACT
└── CONSULTATION
```

Staff: `/admin/`

## Phase 3 — Frontend

Current: static HTML + shared CSS + JS modules. Reusable pieces live in `css/` and `js/` (nav, cards, forms, i18n, API).  
A React/Next.js rewrite is a **future decision**, not required for launch of this public site.

## Phase 4 — Backend

Supabase project `ramdani-law-firm` only.

Public CMS tables exist. These were **not** created (private / speculative):

- clients, case files, internal notes
- industries, lawyer_practices join extras
- applications, media library, documents vault
- site_settings SEO CMS

## Phase 5 — Public vs private

```
PUBLIC SITE                         FUTURE PRIVATE SYSTEM
articles, people, services          clients
published matters (anonymized)      real matters + documents
contact / consultation forms        internal notes
news / careers                      case data
```

Do not store privileged files in the public CMS.

## Phase 6 — Admin

Shipped: content CRUD for public tables + inquiry inbox.  
Not shipped: SEO console, media library, RBAC beyond admin/editor/pending.

## Phase 7 — Security

Shipped: RLS, least privilege for anon, no service_role in frontend, honeypot on forms, staff role check server-side.  
Remaining: OAuth enablement, first admin promotion, Vercel HTTPS + headers after deploy, leaked-password protection in Auth settings.

## Phases 8–13 of the chamber OS

Document/matter pipeline, local SEO content, CI/CD, staging — **after** the public site is live and the firm supplies facts.
