# Ressert MVP

This is an internal web app for managing **Entities**, **Affiliations**, and **Incidents** with CSV import/export, preview, and expandable dictionaries.

## Stack
- Next.js + TypeScript
- Prisma + SQLite (local)

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Generate Prisma client

```bash
npm run prisma:generate
```

3. Run migrations (creates `prisma/dev.db` with SQLite)

```bash
npx prisma migrate dev --name init
```

4. Seed dictionaries and sample data

```bash
npm run seed
```

5. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000

## CSV Templates
- Entities: `entity_uid,entity_name,entity_type,parent_entity,entity_description,entity_country,flags,categories,comment`
- Affiliations: `network,address,entity_uid,address_role,source,analyst,added_at,comment,ext_name,ext_category,ext_wallet_name,ext_label,is_hidden`
- Incidents: `network,address,entity_uid,incident_type,incident_date,source,wallet_role,added_at,analyst,tx_hashes`

## Notes
- Address validation:
  - EVM must be `0x` + 40 hex chars
  - BTC/LTC/TRX use basic pattern checks
- Unknown `entity_uid` during manual entry triggers a prompt with options (create placeholder / set UNKNOWN / fix later).
- CSV import shows a preview and validation summary; invalid rows are skipped and can be downloaded as an error CSV.
- Settings page lets you add dictionary items without code changes.
- Entity report supports Markdown copy and PDF export.
- Admin page `/admin` provides users/roles management. Seed creates `admin@local` with role `admin`.

## Production
For MVP, run with `npm run build` then `npm start`. SQLite file is `prisma/dev.db` (or change `DATABASE_URL` to point to another SQLite file).
