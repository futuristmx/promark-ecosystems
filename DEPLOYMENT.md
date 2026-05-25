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

## Configurar Resend (emails de alertas)

El cron `/api/cron/check-alerts` envía emails cuando detecta vencimientos próximos. Para activarlo en producción:

### 1. Crear cuenta y dominio

1. Crear cuenta en https://resend.com (plan Free: 3,000 emails/mes, suficiente para piloto)
2. Ir a **Domains** → **Add Domain** → ingresar `promark.mx`
3. Resend te da 3 DNS records (SPF, DKIM, MX). Agregarlos al DNS de promark.mx
4. Esperar verificación (5-30 min)

### 2. Generar API Key

1. Dashboard Resend → **API Keys** → **Create API Key**
2. Permisos: **Sending access** (no full access)
3. Copiar el token (empieza con `re_...`)

### 3. Variables Vercel

| Variable | Valor |
|---|---|
| `RESEND_API_KEY` | el token `re_...` del paso 2 |
| `RESEND_FROM_EMAIL` | `alertas@promark.mx` (debe coincidir con dominio verificado) |
| `NEXT_PUBLIC_APP_URL` | `https://promark-ecosystems.vercel.app` (usado en los CTAs del email) |

### 4. Redeploy

Vercel necesita un redeploy para tomar las variables nuevas. Tras el redeploy, el próximo cron diario (`0 14 * * *` UTC) enviará emails reales.

### 5. Trigger de prueba manual

```bash
curl https://promark-ecosystems.vercel.app/api/cron/check-alerts \
  -H "Authorization: Bearer $CRON_SECRET"
```

Esperado:
```json
{ "ok": true, "rulesProcessed": 20, "alertsCreated": N, "emailsSent": M }
```

Si `emailsSent: 0` con alertas creadas, revisar:
- ¿`tenant.config.notifications.notify_email` está seteado en el tenant?
- ¿El dominio está verificado en Resend?
- Logs en Vercel → Function Logs → buscar "sendAlertEmail" o "Resend"

### Sin Resend

Si `RESEND_API_KEY` no está configurado, `lib/alerts/email.ts` cae a logging — el cron sigue funcionando y crea alertas en DB, solo no manda emails. Útil para desarrollo local.

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
| `/api/health` | `0 13 * * *` (diario 13:00 UTC) | revisar logs |

> ⚠️ Vercel plan Hobby limita crons a 1 ejecución/día. Para `/api/health` horario, migrar a Pro o agregar un monitor externo (UptimeRobot, BetterUptime) apuntando al endpoint.

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
