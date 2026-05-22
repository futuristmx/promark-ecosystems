# DEPLOYMENT — Promark®

## Checklist de variables de entorno en Vercel

Vercel Dashboard → tu proyecto → Settings → Environment Variables.

- [ ] `DATABASE_URL` → pooler **transaction** (puerto **6543**)
- [ ] `DIRECT_DATABASE_URL` → pooler **session** (puerto **5432**) — solo migraciones
- [ ] `NEXT_PUBLIC_SUPABASE_URL` → `https://[project-ref].supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` → JWT del Anon Key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` → Service Role Key (server-side; NUNCA exponer)
- [ ] `JWT_SECRET` → 32+ caracteres (genera: `openssl rand -base64 32`)
- [ ] `CRON_SECRET` → Bearer token (genera: `openssl rand -base64 24`)
- [ ] `NEXT_PUBLIC_APP_URL` → `https://tu-dominio.vercel.app`
- [ ] `NEXT_PUBLIC_APP_NAME` → `Promark Ecosystems`
- [ ] `RESEND_FROM_EMAIL` → `alertas@promark.mx`
- [ ] `RESEND_API_KEY` → Opcional. Sin él, los emails de alerta solo se loguean a consola.

---

## Configurar Resend (emails)

1. Crear cuenta en https://resend.com
2. Verificar dominio `promark.mx` (DNS records)
3. Generar API Key en el dashboard
4. Agregar como `RESEND_API_KEY` en Vercel
5. Redeploy para que tome la variable

Sin Resend configurado, `lib/alerts/email.ts` cae a logging — el cron sigue funcionando, solo no manda emails.

---

## Bucket de Supabase Storage

Aplicar el SQL en `supabase/migrations/20260522_storage_bucket.sql`:

1. Supabase Dashboard → tu proyecto → **SQL Editor** → **New query**
2. Pegar el contenido del archivo
3. **Run**

Verifica que aparezca el bucket `tenant-documents` en Storage:
- `public: false`
- `file_size_limit: 52428800` (50 MB)
- MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

---

## Migrations Prisma

El schema inicial se aplica con:
```bash
DATABASE_URL=... DIRECT_DATABASE_URL=... npx prisma db push
```

Para usar migrations formales (recomendado producción):
```bash
# Marcar la migración inicial como aplicada (Sprint 6 D7)
npx prisma migrate resolve --applied 0_init

# Aplicar nuevas migraciones cuando existan
npx prisma migrate deploy
```

La migración `prisma/migrations/0_init/migration.sql` representa el schema completo
después del Sprint 5. Se generó con `prisma migrate diff --from-empty`.

---

## Verificar crons

Vercel Dashboard → tu proyecto → **Cron Jobs**.

Deben aparecer:

| Path | Schedule | Última ejecución |
|---|---|---|
| `/api/cron/check-alerts` | `0 14 * * *` (diario 14:00 UTC) | revisar logs |
| `/api/health` | `0 * * * *` (hourly) | revisar logs |

Ambos requieren `Authorization: Bearer $CRON_SECRET`. Vercel lo inyecta automáticamente.

Smoke test manual:
```bash
curl https://promark-ecosystems.vercel.app/api/health
# Esperado: 200 { "database": true, "timestamp": "...", "version": "..." }

curl https://promark-ecosystems.vercel.app/api/cron/check-alerts \
  -H "Authorization: Bearer $CRON_SECRET"
# Esperado: 200 { "ok": true, "rulesProcessed": N, ... }
```

---

## Rollback

Vercel Dashboard → tu proyecto → **Deployments** → seleccionar el deploy anterior
verde → **Promote to Production**.

El rollback aplica en <30 segundos. NO afecta la base de datos — solo el código.
Si el rollback necesita revertir cambios de schema, hay que aplicar la migración
inversa en Supabase manualmente.

---

## REGLA CRÍTICA — Supabase pooler

```
DATABASE_URL         → transaction pooler, puerto 6543 → RUNTIME serverless
DIRECT_DATABASE_URL  → session pooler,     puerto 5432 → SOLO migraciones
```

`lib/prisma/client.ts` debe:
- Preferir `DATABASE_URL` sobre `DIRECT_DATABASE_URL`
- Usar `pg.Pool({ max: 1 })` por invocación serverless

**NO invertir el orden. NO subir el max.**

### Historia del bug

El session pooler tiene un límite duro de 15 conexiones en el plan Free de
Supabase. Si `lib/prisma/client.ts` lo usa en runtime serverless, cualquier
ráfaga de queries paralelas (e.g., el dashboard ejecuta 8 queries con
`Promise.all`) satura el pool y produce:

```
DriverAdapterError: (EMAXCONNSESSION) max clients reached in session mode
```

El error se manifiesta como 500 en `/dashboard` (y cualquier ruta con queries
agregadas). Fue corregido en el hotfix `55fc362` después de Sprint 5.

Ver `lib/prisma/client.ts` para la configuración correcta.

---

## Bug conocido — Turbopack y `®` en path local

Next.js 16.2.6 con Turbopack tiene un panic cuando la ruta del proyecto contiene
caracteres multibyte como `®`. Error:

```
start byte index 27 is not a char boundary; it is inside '®'
```

**Solo afecta builds locales** (`npm run build`). Vercel construye en un path
ASCII (`/vercel/path0/...`) y no se ve afectado.

Workarounds:
- Renombrar la carpeta local a `3-Promark` (sin ®)
- O construir vía rsync a `/tmp/promark-build`
- O confiar en Vercel preview builds para validación
