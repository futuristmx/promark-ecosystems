<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Supabase pooler — connection strings (CRÍTICO)

Dos URLs distintas, con propósitos NO intercambiables:

- **`DATABASE_URL`** → transaction pooler, puerto **6543**. Usar en runtime serverless (Prisma client de la app, route handlers, server components).
- **`DIRECT_DATABASE_URL`** → session pooler, puerto **5432**. Usar **solo** para migraciones (`prisma db push`, `prisma migrate`, `prisma db seed`).

El session pooler tiene un límite duro de 15 conexiones en plan Free. Si Prisma client de la app lo usa en serverless, cualquier ráfaga de queries paralelas → `EMAXCONNSESSION` → 500 en producción.

`lib/prisma/client.ts` debe preferir `DATABASE_URL` y usar `pg.Pool` con `max: 1` por invocación. No cambiar este orden ni quitar el cap del pool sin discutir las implicaciones.
