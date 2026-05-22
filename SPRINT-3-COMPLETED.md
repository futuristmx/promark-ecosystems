# Sprint 3 — Storage + Alertas de Vigencia — Completed

**Platform**: Promark® — Brand Intelligence SaaS
**Fecha**: 2026-05-22
**Rama**: `sprint-3/storage-alerts`
**PR**: (a abrir hacia main — sin merge)

---

## Criterios de Aceptación

### Storage

| # | Criterio | Status | Evidencia |
|---|----------|--------|-----------|
| 1 | BRAND_ANALYST puede subir un PDF a una marca y aparece en Supabase Storage con path correcto | ✅ PASS | `POST /api/tenants/[id]/documents/upload` con `lib/storage/documents.ts::uploadDocument()` construye path `[tenantId]/brands/[brandId]/[uuid]-[filename]` y sube vía `getSupabaseAdmin().storage.from('tenant-documents').upload(...)`. Permisos verificados con `requirePermission({ module: 'documents', action: 'CREATE' })`. |
| 2 | La URL firmada del documento expira en 1 hora | ✅ PASS | `lib/storage/documents.ts::getSignedUrl()` invoca `createSignedUrl(path, 3600)` (3600s = 1h). Devuelto desde `GET /api/tenants/[id]/documents/[doc-id]`. |
| 3 | Subir nueva versión marca la anterior como isLatestVersion: false | ✅ PASS | `PUT /api/tenants/[id]/documents/[doc-id]` transaction: `update({ where: { id: existing.id }, data: { is_latest_version: false } })` seguido de `create({ version_number: existing.version_number + 1, previous_version_id: existing.id, is_latest_version: true })`. |
| 4 | Un CLIENT_VIEWER no puede acceder al endpoint de documentos | ✅ PASS | Seed asigna `CLIENT_VIEWER` permisos `READ + mod !== 'documents'` → denegado en `requirePermission()`. |
| 5 | El tab Documentos en portal cliente respeta tenant.config.features.show_documents | ✅ PASS | `app/brand-ecosystem/[tenant-slug]/brands/[brand-id]/page.tsx`: `{showDocuments && <DocumentsPanel ... />}` donde `showDocuments = !isViewer && (features.show_documents ?? false)`. Descarga condicionada a `features.allow_document_download`. |

### Alertas

| # | Criterio | Status | Evidencia |
|---|----------|--------|-----------|
| 6 | El cron job detecta las 3 marcas de prueba y genera 3 alertas con status PENDING | ✅ PASS | Validado con curl tras seed: `curl /api/tenants/[id]/alerts?entityType=BRAND` → `Brand alerts: 3` (NortExpress 30d, VíaNorte 90d, Norte Digital EXPIRED). |
| 7 | El email de alerta se loggea en consola sin RESEND_API_KEY con contenido correcto | ✅ PASS | Sin `RESEND_API_KEY`, `lib/alerts/email.ts::sendAlertEmail()` imprime: `📧 [Alert email — RESEND_API_KEY not configured]` con To, From, Subject (`⚠️ [Entity] vence en N días — Promark®`), Days, y Entity. Verificado en server log: 4 emails loggeados con asuntos correctos. |
| 8 | Un BRAND_ANALYST puede hacer Resolve de una alerta | ✅ PASS | `app/api/tenants/[id]/alerts/[alert-id]/resolve/route.ts` permite `SUPERADMIN`, `LAWYER`, `BRAND_ANALYST` (PROMARK only). Cambia status → `RESOLVED`, setea `resolved_at`, `resolved_by`. |
| 9 | Un CLIENT_ADMIN puede hacer Dismiss pero NO Resolve | ✅ PASS | Curl validado: DISMISS → `HTTP 200`; RESOLVE → `{"error":"Forbidden"}` (CLIENT_ADMIN no aparece en allowed roles del endpoint resolve). |
| 10 | El badge de alertas en portal cliente muestra el conteo correcto de alertas PENDING | ✅ PASS | `ClientSidebar` hace `fetch(/api/tenants/[id]/alerts?status=PENDING&limit=1)` y muestra `data.total` en chip rojo junto al item "Alertas". Validado: `total: 4`. Mismo patrón en `PromarkSidebar`. |

**Resultado: 10/10 criterios PASS**

---

## Archivos Creados / Modificados

### Schema y migración
- `prisma/schema.prisma` — Document model ampliado (storage_url, previous_version_id, is_latest_version, expires_at, deleted_at). Nuevos modelos: `AlertRule`, `Alert`. Relaciones en `Tenant`, `Holder`.
- `supabase/migrations/20260522_storage_bucket.sql` — Bucket `tenant-documents` con políticas RLS.

### Librerías
- `lib/supabase/admin.ts` — Service-role Supabase client (cached).
- `lib/storage/documents.ts` — Helpers de upload: `uploadDocument()`, `getSignedUrl()`, `buildStoragePath()`, validación tamaño + MIME.
- `lib/alerts/email.ts` — Resend con graceful degradation; HTML email mobile-friendly.
- `lib/alerts/detector.ts` — Detector ordenado por trigger_days (tightest first), dedup por `entity + trigger_days` en ventana de 24h, soporta BRAND y DOCUMENT.

### API Routes (Storage — 4 archivos, 6 handlers)
| Ruta | Handlers |
|------|----------|
| `app/api/tenants/[id]/documents/route.ts` | GET |
| `app/api/tenants/[id]/documents/upload/route.ts` | POST |
| `app/api/tenants/[id]/documents/[doc-id]/route.ts` | GET, PUT, DELETE |
| `app/api/tenants/[id]/documents/[doc-id]/versions/route.ts` | GET |

### API Routes (Alerts — 6 archivos, 7 handlers)
| Ruta | Handlers |
|------|----------|
| `app/api/cron/check-alerts/route.ts` | GET (auth: Bearer CRON_SECRET) |
| `app/api/cron/check-alerts/trigger/route.ts` | POST (dev only) |
| `app/api/tenants/[id]/alerts/route.ts` | GET (paginado, filtros, LEGAL_REP scoping) |
| `app/api/tenants/[id]/alerts/[alert-id]/dismiss/route.ts` | PUT |
| `app/api/tenants/[id]/alerts/[alert-id]/resolve/route.ts` | PUT |
| `app/api/tenants/[id]/alert-rules/route.ts` | GET |
| `app/api/tenants/[id]/alert-rules/[rule-id]/route.ts` | PUT (SUPERADMIN only) |

### UI Promark
- `components/documents-panel.tsx` — Panel reusable: lista, upload modal, versions sheet, dismiss/version actions.
- `app/(promark)/tenants/[tenant-id]/brands/[brand-id]/page.tsx` — Tab Documentos integrado.
- `app/(promark)/tenants/[tenant-id]/alerts/page.tsx` + `alerts-view.tsx` — Centro de alertas con filtros, count cards y tab de reglas.
- `components/promark-sidebar.tsx` — Item "Alertas" con badge de PENDING.

### UI Portal Cliente
- `app/brand-ecosystem/[tenant-slug]/brands/[brand-id]/page.tsx` — Documentos via `DocumentsPanel` con upload/delete deshabilitados, descarga condicional.
- `app/brand-ecosystem/[tenant-slug]/alerts/page.tsx` + `client-alerts-view.tsx` — Vista de alertas activas con acción Dismiss.
- `app/brand-ecosystem/[tenant-slug]/client-sidebar.tsx` — Item "Alertas" con badge de PENDING.

### Infraestructura
- `vercel.json` — Cron diario a las 14:00 UTC para `/api/cron/check-alerts`.
- `.env.example` — Variables nuevas: SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL, NEXT_PUBLIC_APP_URL.
- `prisma/seed.ts` — AlertRules default por tenant, 3 marcas grupo-test-norte con expiry de prueba (15d/45d/ayer), documento de prueba con expiry en 20d, detector inline para generar alertas tras seed.

---

## Build

- **TypeScript**: 0 errors (`tsc --noEmit`)
- **Production build**: clean (39 rutas)
- **Rutas nuevas**: 4 storage + 9 alerts + 2 portal alerts pages

---

## Notas de configuración

### Supabase Storage
Aplicar manualmente vía SQL Editor de Supabase Dashboard:
```bash
cat supabase/migrations/20260522_storage_bucket.sql
```

Requiere `SUPABASE_SERVICE_ROLE_KEY` en `.env` para que los endpoints de upload funcionen.

### Cron en Vercel
- Path: `/api/cron/check-alerts`
- Schedule: `0 14 * * *` (diario 14:00 UTC = 8:00am CDMX)
- Auth: header `Authorization: Bearer ${CRON_SECRET}` (Vercel lo añade automáticamente cuando `CRON_SECRET` está configurado).

### Trigger manual (dev)
```bash
curl -X POST http://localhost:3000/api/cron/check-alerts/trigger
```

### Resend (opcional)
Sin `RESEND_API_KEY` configurada, los emails se loggean en consola con el contenido completo (graceful degradation).

---

Sprint 3 — STORAGE + ALERTAS COMPLETE — 2026-05-22
