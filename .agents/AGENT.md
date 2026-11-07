# AGENT.md

Rules for AI agents working in this repository. Follow them on every change.

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js
- **Database:** PostgreSQL
- **ORM:** Prisma

Do not introduce other frameworks, ORMs, or databases.

keep all backend related files in backend/
keep all frontend releated files in frontend/
this is a monorepo with both backend and frontend , keep it seperate

## Database Changes

- Every change to the database schema needs its own **new migration file**.
- Put migration files in `backend/migrations/` (and `backend/prisma/migrations/` for Prisma).
- Never edit an existing migration. Add a new one instead.

## Components and Reusability

- Build reusable pieces as **components** so they can be imported elsewhere.
- Example: a new model goes in its own component, not directly inside a larger file.
- Every new component goes in its **own separate file**.

## File Size and Readability

- Keep files small and focused. Large files are hard to read.
- If a file grows too big, split it into smaller components or modules.