# Sprint 6 — Cierre MDP

Rama: `sprint-6/mdp-closure`
Base: `main` post-Sprint 5 + hotfix pooler (`55fc362`)

---

## Status por entregable

### 1. ✅ Smoke test `/api/health` + vercel.json cron
- `app/api/health/route.ts`: endpoint que ejecuta `SELECT 1` contra Prisma y retorna `{ database, timestamp, version }` con 200/503
- `vercel.json`: cron daily 13:00 UTC (Hobby plan no permite hourly — documentado en DEPLOYMENT.md)
- Commits: `624ce9c`, `09637f1`

### 2. ✅ Estados vacíos en toda la UI
- `app/(promark)/dashboard/page.tsx`: "Sin datos disponibles aún" + CTA cuando todos los counts = 0
- `app/(promark)/tenants/[tenant-id]/structure/page.tsx`: "Sin estructura corporativa registrada" + CTA "Crear holding"
- Empty states de marcas, contratos, alertas, licencias, documentos: ya existían de Sprint 3/4
- Banner "Tu sesión expiró" en `/login` cuando `?message=session_expired`
- Commit: `396cbde`

### 3. ✅ Flujos críticos end-to-end corregidos
- Auto-slug en `POST /api/tenants` (deriva del name + sufijos -2, -3 en colisión)
- Commit: `eca5524`

| Flujo | Status | Notas |
|---|---|---|
| 1. Onboarding cliente | ✅ PASA | Slug autogen + PIN auth + portal login operativos |
| 2. Ciclo de marca | ✅ PASA | CRUD + VigencyDot + grafo + detector alertas OK |
| 3. Documental | 🟡 PARCIAL | Upload + storage OK. Versionado tiene gap: siempre setea `version_number:1, is_latest_version:true`. **DIFERIDO** |
| 4. Contratos + alertas | ✅ PASA | Role enforcement correcto (LAWYER/SUPERADMIN resolve, CLIENT_ADMIN dismiss, VIEWER denied) |
| 5. Personalización tenant | ❌ DIFERIDO | TenantVersion model existe; editor UI fuera de scope del cierre |

### 4. ✅ Pulido UI
- `app/layout.tsx`: metadata `title: "Promark®"`, descripción en ES, `lang="es-MX"`
- `app/icon.svg`: favicon SVG con "PM" sobre #3E6AE1
- `app/brand-ecosystem/[tenant-slug]/layout.tsx`: footer "Promark® — Inteligencia Marcaria {year}"
- Loading states ya existían para `/dashboard`, `/tenants`, `/tenants/[id]/panel`
- Strings inglés y badges status: ya limpiados en `sprint-i18n/es-mx`
- Commit: `3938ebf`

### 5. ✅ Documentación
- `README.md` reescrito (template Next default reemplazado): descripción, stack, env vars, comandos, roles, procedimiento agregar tenant
- `DEPLOYMENT.md` nuevo: checklist env vars, Resend setup, bucket Storage, migrations, crons, rollback, regla del pooler con historia del hotfix
- Commit: `730631a`

### 6. ✅ Seed limpio (NO aplicado todavía)
- `prisma/seed.ts` actualizado:
  - Limpia slugs viejos: `grupo-test-norte`, `alimentos-demo-sa`
  - **Tenant 1** `grupo-norteno` — "Grupo Norteño S.A. de C.V." — 8 marcas (5 activas + 1 a 45d + 1 a 15d + 1 vencida -45d), clases IMPI 29/30/35, usuarios GTN-001/002/003 con PINs 1234/5678/9012
  - **Tenant 2** `alimentos-pacifico` — "Alimentos del Pacífico" — 5 marcas (4 activas + 1 a 30d), clases IMPI 29/43, usuarios ADS-001/002 con PINs 1111/2222
  - Promark superadmin `mcadena@promark.mx` preservado vía upsert
- Commit: `896eb03`

**⚠️ Aplicar manualmente post-merge:**
```bash
DATABASE_URL="postgresql://postgres.atvgvoclcecowochfavy:Promark_2026@aws-1-us-west-2.pooler.supabase.com:6543/postgres" \
DIRECT_DATABASE_URL="postgresql://postgres.atvgvoclcecowochfavy:Promark_2026@aws-1-us-west-2.pooler.supabase.com:5432/postgres" \
npx prisma db seed
```

### 7. ✅ Deuda técnica
- `prisma/migrations/20260521000000_init/migration.sql` regenerado con schema actual (23 tablas, 715 líneas, incluye Contract/License/ContractHistory de Sprints 4-5)
- `lib/prisma/client.ts`: confirmado correcto (DATABASE_URL preferido, pg.Pool max:1)
- `AGENTS.md`: sección "Supabase pooler — connection strings (CRÍTICO)" + "Git — push policy" + bug Turbopack ® documentado
- Storage bucket `supabase/migrations/20260522_storage_bucket.sql` ya existía (aplicado en sesión previa)
- Commit: `67260b5`

**⚠️ Aplicar manualmente post-merge:**
```bash
DATABASE_URL=... DIRECT_DATABASE_URL=... npx prisma migrate resolve --applied 20260521000000_init
```

### 8. ✅ Verificación final preview

Preview URL: `https://promark-ecosystems-4jhbuuxo5-futurist-s-projects.vercel.app`

| Endpoint | Status | Resultado |
|---|---|---|
| `/api/health` | 200 | `{ database: true, timestamp, version }` |
| `/login` | 200 | OK |
| `/brand-ecosystem/grupo-norteno/login` | 200 | OK (ruta existe — seed no aplicado todavía, layout muestra 404 visual cuando tenant no existe) |
| `/api/cron/check-alerts` | 200 | `{ ok: true, rulesProcessed: 20, candidatesFound: 5, alertsCreated: 0 }` |

(Smoke tests via `vercel curl` por SSO en previews)

---

## Build

- ✅ Compiled successfully in 29s (Turbopack, Vercel build)
- ✅ TypeScript passed in 16s
- ✅ 12 static pages generated
- ✅ Deploy READY

---

## Acciones requeridas del usuario después del merge

1. **Aplicar el seed nuevo** (sobrescribe los tenants de prueba viejos):
   ```bash
   DATABASE_URL=... DIRECT_DATABASE_URL=... npx prisma db seed
   ```

2. **Marcar migración inicial como aplicada** (las tablas ya existen vía `db push`):
   ```bash
   DIRECT_DATABASE_URL=... npx prisma migrate resolve --applied 20260521000000_init
   ```

3. **Verificar producción post-merge:**
   ```bash
   curl https://promark-ecosystems.vercel.app/api/health
   # Esperado: { "database": true, ... }
   ```

---

## Diferidos (fuera de scope del cierre)

- **Versionado real de documentos** (Flujo 3): `app/api/tenants/[id]/documents/upload/route.ts` siempre hardcodea `version_number: 1`. Requiere lookup por entity+filename + transacción que demote la versión previa.
- **Editor de personalización de tenant** (Flujo 5): UI para editar `tenant.config.branding`, push de TenantVersion, rollback. ~3-5 días de trabajo.
- **Cron horario `/api/health`**: requiere plan Vercel Pro. Workaround: monitor externo (UptimeRobot, BetterUptime).
