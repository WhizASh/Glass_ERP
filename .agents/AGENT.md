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

## Data and Seeding

- Always add date in db only , do not create in memory data , create a seed file that will add the dummy data if want to add.
- Always store and manage data/dates in the database only. Do not use in-memory mock or demo data.
- If dummy/sample data is needed, create a seed file/script to populate the database.

## Backend Architecture & Error Handling

- **Layer Separation:** Keep controllers thin (HTTP validation and response only). Place domain logic, calculations, and multi-step DB transactions in service files under `backend/src/services/`.
- **No Silent Fallbacks:** Never catch DB errors to return mock/in-memory data. Return proper error status codes (`500`/`503`) and log the DB error.
- **Calculations Single Source of Truth:** Backend calculations are authoritative for quotes, prices, square footage, and taxes. Frontend calculation utilities are strictly for client preview.
- **Prisma Decimals:** Convert or handle `Prisma.Decimal` types carefully to avoid precision loss or accidental string concatenation.

## Frontend Architecture

- **Centralized API:** Route all network requests through `frontend/src/services/api.js`. Do not call `fetch()` directly in UI components.
- **View Decomposition:** Views under `frontend/src/components/views/` should orchestrate state and components, not contain large inline modals or tables (> 250 lines).

## Components and Reusability

- Build reusable pieces as **components** so they can be imported elsewhere.
- Example: a new model goes in its own component, not directly inside a larger file.
- Every new component goes in its **own separate file**.

## File Size and Readability

- Keep files small and focused. Large files are hard to read.
- If a file grows too big, split it into smaller components or modules.

