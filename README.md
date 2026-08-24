# Supabase Ultra

Community node for n8n providing advanced Supabase/PostgREST database operations.

## V1.0.0
- Select
- Insert
- Upsert
- Update
- Delete
- Count
- RPC
- JSON or Input Items for writes
- Filters for Select/Update/Delete/Count
- Pagination for Select / Return All
- Conflict Columns and Ignore Duplicates for Upsert

## Install
Settings → Community Nodes → Install → `n8n-nodes-supabase-ultra`

## Credentials
Supabase URL and API Key. For self-hosted Supabase, use the base URL of the instance.

## Upsert
Set Operation=Upsert, Table, Data Source, and Conflict Columns such as `filial,numero,serie`. The conflict columns must have a suitable UNIQUE constraint/index in PostgreSQL.

## Development
`npm install` then `npm run build` then `npm pack`.

MIT License. Copyright (c) 2026 Maxuell02.
