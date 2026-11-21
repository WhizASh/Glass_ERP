# Glass ERP

Glass ERP is a React and Express app for customers, glass quotations, sales orders, tax invoices, purchases, staff, and ledgers. The backend uses PostgreSQL through Prisma.

## Requirements

- Node.js and npm (a current Node.js LTS release)
- A PostgreSQL database; the example configuration uses Supabase
- Database credentials with permission to apply migrations if setting up a new database

## Local setup

From the repository root, install the three sets of dependencies:

```bash
npm ci
npm --prefix backend ci
npm --prefix frontend ci
```

Copy the example environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your own database connection strings. `DATABASE_URL` is used by the running app; `DIRECT_URL` is used by Prisma migrations. Set `CLIENT_URL` to the frontend address (normally `http://localhost:5173`). `frontend/.env` defaults to the local API at `http://localhost:5000/api`.

For a **new database**, apply all committed migrations:

```bash
cd backend
npx prisma migrate deploy
cd ..
```

For an **existing shared database**, check its migration state before changing it:

```bash
cd backend
npx prisma migrate status
cd ..
```

Start both servers from the repository root:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at `http://localhost:5000`.

## Prisma: migration and client generation

Migrations change the **database schema**. `prisma generate` builds the JavaScript Prisma Client from `backend/prisma/schema.prisma` so backend code can use those tables. These are separate steps. Installing backend dependencies runs client generation automatically. If the schema changes while dependencies are already installed, run:

```bash
cd backend
npx prisma generate
```

The backend also generates the client before `npm start`. A deployment must include the updated code and generated client after a schema change.

## Optional demo data

Once migrations are applied, add demo customers, products, quotations, and sales orders:

```bash
npm run db:seed
```

This seed script adds demo records without deleting existing data. Preview it with `npm run db:seed -- --dry-run`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start frontend and backend in development mode |
| `npm run build:frontend` | Build the frontend for production |
| `npm run test:frontend` | Run frontend calculation tests |
| `npm run test:backend` | Run backend tests |
| `npm --prefix backend start` | Start only the backend |
| `npm --prefix frontend run dev` | Start only the frontend |

Keep `.env` files private; the `.env.example` files contain placeholders and can be shared.
