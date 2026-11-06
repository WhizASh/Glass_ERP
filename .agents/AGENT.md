# AGENT.md

Rules for AI agents working in this repository. Follow them on every change.
See full rules guide in [AGENTS.md](file:///home/yash/mern_stack/intern/ERP/AGENTS.md).

## Tech Stack

- **Frontend:** React 18 (Vite, Tailwind CSS, Lucide, Recharts)
- **Backend:** Node.js, Express REST API
- **Database:** PostgreSQL
- **ORM:** Prisma

Do not introduce other frameworks, ORMs, or databases.

## Commands

- Frontend Build: `npm --prefix frontend run build`
- Frontend Dev: `npm --prefix frontend run dev`
- Backend Tests: `npm --prefix backend test`
- Backend Dev: `npm --prefix backend run dev`
- Migrations: `npm --prefix backend run prisma:migrate`

## Database Changes

- Every change to the database schema needs its own **new migration file**.
- Put migration files in `backend/migrations/`.
- Never edit an existing migration. Add a new one instead.

## Components and Reusability

- Build reusable pieces as **components** so they can be imported elsewhere.
- Example: a new modal goes in its own component, not directly inside a larger file.
- Every new component goes in its **own separate file**.

## File Size and Readability

- Keep files small and focused (ideally under 250 lines). Large files are hard to read and maintain.
- If a file grows too big, split it into smaller components or modules.

## Business Domain & Data Conventions

- Architectural glass conforms to **IS 2553 (Part 1)** standard.
- Use localized Indian business attributes: 15-character GSTIN (`27AABCA1234F1Z9`), phone numbers formatted as `+91 98XXX XXXXX`, and realistic Indian commercial addresses.
