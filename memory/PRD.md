# Suzanne Cherian — Portfolio PRD

## Original Problem Statement
Build a dynamic, admin-editable portfolio for Suzanne Cherian (Graphic Designer | Illustrator, Bangalore, India). Admin can manage categories and projects (Behance iframes, Google Drive image/video, image URLs). Card click → split-screen modal (LEFT = work media, RIGHT = description). Only admin dashboard is password-protected. Contact form via Resend. Target deployment: Vercel + NeonDB (currently built on MongoDB for Emergent preview; migration deferred).

## Architecture
- **Backend**: FastAPI + Motor (MongoDB) + JWT (bcrypt) + Resend
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui + Framer Motion + Sonner toasts
- **Design system**: Swiss / High-contrast — white BG, black text (#0A0B10), red accent (#FF3333), Cabinet Grotesk + Satoshi, sharp corners (no radius), generous spacing
- **Routes**: `/` (public), `/admin/login`, `/admin` (protected via JWT bearer in localStorage)

## User Personas
1. **Suzanne (admin)** — single account, manages everything via `/admin`
2. **Visitors / potential clients** — browse work, send inquiries via contact form

## Core Requirements (Static)
- Public hero with animated profile picture, marquee, "Available for Freelance" badge
- Asymmetric tetris portfolio grid with category filters
- Split-screen project modal (60/40 media / description)
- Behance iframe embeds + Google Drive image & video link support
- Contact form → Resend email + stored message
- Admin: login, profile editor, categories CRUD, projects CRUD, messages inbox

## What's Been Implemented (2026-02-12)
- ✅ JWT auth with bcrypt, admin seeded from env on startup
- ✅ Profile singleton (GET public, PUT admin)
- ✅ Categories CRUD (4 default seeded)
- ✅ Projects CRUD (media types: image, video, behance, iframe + raw iframe embed snippet)
- ✅ Contact submit + Resend email + admin message inbox
- ✅ Public site: Header, Hero (animated portrait), About, Portfolio Grid, Project Modal, Contact, Footer
- ✅ Admin dashboard with 4 tabs (Projects, Categories, Profile, Messages)
- ✅ Google Drive link normalization utility
- ✅ 26/26 backend pytest tests passing, all critical UI flows validated

## Prioritized Backlog
**P0**: All shipped above
**P1**:
- Suzanne uploads her real profile pic + initial projects via admin
- Optional: migrate DB to NeonDB Postgres + deploy to Vercel (user will do post-handoff)
**P2**:
- Image lightbox in modal (currently iframe/scrollable image)
- Drag-to-reorder for projects/categories
- SEO meta tags pulled from profile
- Analytics (Plausible / GA)
- "Featured" projects sorted to top of grid

## Next Tasks
1. Suzanne logs in and adds her real Behance projects + profile pic
2. Verify Resend sender domain (currently using `onboarding@resend.dev` test sender)
3. Future: NeonDB migration + Vercel deployment

## Credentials
See `/app/memory/test_credentials.md`
