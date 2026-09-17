# DATABASE

Project: `ramdani-law-firm` (`glyynqeksiqrssrvshba`). Empty public schema at first apply.

Tables (all RLS enabled):

| Table | Purpose | Public read |
|---|---|---|
| profiles | staff identity, role, status | no |
| people | advocate profiles | published only |
| practice_areas | practice areas | published only |
| services | legal services | published only |
| matters | public representative matters | published only |
| articles | insights | published only |
| news | firm news | published only |
| resources | public resources | published only |
| careers | job posts | published only |
| inquiries | contact + consultation submissions | no |
| audit_events | staff action log (optional inserts) | no |

No client files, case numbers, or privileged documents are stored.
