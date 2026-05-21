# Supabase Setup — Validación Completada

**Platform**: Promark® — Brand Intelligence SaaS  
**Fecha**: 2026-05-21  
**Proyecto Supabase**: `atvgvoclcecowochfavy` (atvgvoclcecowochfavy.supabase.co)  
**Repo**: https://github.com/futuristmx/promark-ecosystems

---

## Criterios de Aceptación

| # | Criterio | Status | Evidencia |
|---|----------|--------|-----------|
| 1 | **Supabase Auth login** — `mcadena@promark.mx` autentica con email+password | ✅ PASS | `POST /auth/v1/token` → `user_id: 55fde3a5-da36-4112-86f5-f61fb9a52dae`, `access_token` válido |
| 2 | **auth_id vinculado en DB** — `supabase_auth_id` coincide en tabla `user_promarks` | ✅ PASS | `mcadena@promark.mx → auth_id: 55fde3a5-...52dae / role: SUPERADMIN` |
| 3 | **Tenants seeded** — Al menos 2 tenants activos en la base de datos | ✅ PASS | 2 tenants: `grupo-test-norte`, `alimentos-demo-sa` |
| 4 | **Client users seeded** — 4 usuarios client con card_id y PIN funcional | ✅ PASS | `GTN-001(CLIENT_ADMIN)`, `GTN-002(CLIENT_VIEWER)`, `ADS-001(CLIENT_ADMIN)`, `ADS-002(CLIENT_VIEWER)` |
| 5 | **Brands seeded** — 10 marcas distribuidas entre tenants | ✅ PASS | 10 brands seeded (5 per tenant) |
| 6 | **Role permissions** — Permisos configurados para todos los roles | ✅ PASS | 426 role permissions configured (7 roles × 11 modules × 6 actions) |
| 7 | **Dual auth funcional end-to-end** | ✅ PASS | Ver detalles abajo |

### Criterio 7 — Desglose

| Sub | Test | Resultado |
|-----|------|-----------|
| 7a | Client PIN auth genera JWT válido | ✅ `POST /api/auth/client-pin` → `GTN-001` + PIN `123456` → JWT con `CLIENT_ADMIN @ grupo-test-norte` |
| 7b | PIN incorrecto es rechazado | ✅ PIN `000000` → `error: INVALID_PIN` |
| 7c | Brand ecosystem routing por tenant | ✅ `/brand-ecosystem/grupo-test-norte/login` → HTTP 200 |
| 7d | Build de producción sin errores | ✅ `npm run build` → Compiled successfully, 10 routes, 0 errors |

---

## Configuración Aplicada

### Variables de Entorno (`.env`)

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://atvgvoclcecowochfavy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` (configurado) |
| `DATABASE_URL` | `prisma+postgres://localhost:51213/...` (Prisma dev local) |
| `DIRECT_DATABASE_URL` | `postgres://postgres:postgres@localhost:51214/template1` |
| `JWT_SECRET` | Configurado (para client PIN JWT) |

### Usuario Supabase Auth

| Campo | Valor |
|-------|-------|
| Email | `mcadena@promark.mx` |
| Auth ID | `55fde3a5-da36-4112-86f5-f61fb9a52dae` |
| Email confirmado | Sí |
| Rol en Promark | `SUPERADMIN` |

### Prisma Adapter

- **Driver**: `@prisma/adapter-pg` con `pg.Pool`
- **Razón**: Prisma 7.8.0 `prisma-client-js` requiere `adapter` o `accelerateUrl`; el proxy local `prisma dev` no soporta HTTP con Client v7.8.0, por lo que se usa conexión TCP directa via `pg.Pool`

---

## Comandos de Verificación

```bash
# Iniciar base de datos local
npx prisma dev start default --detach

# Verificar estado
npx prisma dev ls

# Iniciar dev server
npm run dev

# Login Supabase (curl)
curl -X POST "https://atvgvoclcecowochfavy.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"mcadena@promark.mx","password":"****"}'

# PIN auth (curl)
curl -X POST http://localhost:3000/api/auth/client-pin \
  -H "Content-Type: application/json" \
  -d '{"card_id":"GTN-001","pin":"123456","tenant_slug":"grupo-test-norte"}'
```

---

Supabase Setup — VALIDACIÓN COMPLETADA — 2026-05-21
