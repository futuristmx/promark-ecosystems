# DEMO-AUDIT — Sesión 2026-05-22

Audit manual de producción ejecutado vía MCP Chrome. Objetivo: identificar bugs, gaps UX y huecos funcionales antes de demo cliente legal.

URL: `https://promark-ecosystems.vercel.app`
Tenants probados: `grupo-norteno` (8 marcas, 3 contratos), `alimentos-pacifico` (5 marcas, sin contratos)
Roles probados: SUPERADMIN Promark, CLIENT_ADMIN, CLIENT_VIEWER, CLIENT_LEGAL_REP

---

## Cosas que SÍ funcionan bien

Para no perder perspectiva. La base está sólida:

- ✅ **Login PIN multitenancy** — JWT cookies funcionan, separación clara entre Supabase Auth (staff) y PIN (cliente)
- ✅ **Aislamiento tenant** — un usuario nunca ve datos de otro tenant
- ✅ **Holder filtering para LEGAL_REP** — usuario GTN-003 solo ve 3 marcas asignadas a su holder (no las 8 del tenant)
- ✅ **Catálogo de marcas cliente** — tabla limpia, VigencyDot funcional (verde/naranja/rojo), filtros operativos
- ✅ **Detalle de marca** — cards bien organizados, fechas formato ES, link "Volver a marcas"
- ✅ **Alertas cliente** — 4 alertas detectadas correctamente (marca 15d, doc 20d, contrato 20d, marca 45d)
- ✅ **Vista Grafo (Promark side)** — visualización del ecosistema holding → empresas → marcas → contratos → alertas. **Esto es el wow-factor del producto.**
- ✅ **Dashboard Promark** — KPIs correctos (13 marcas totales, 3 contratos, 4 alertas críticas), donut chart, bar chart top 5 clientes
- ✅ **Estructura Corporativa** — holding + empresas, "+ Nuevo Holding", "+ Nueva Empresa", contadores marcas/empresa
- ✅ **Footer branded** — "Promark® — Inteligencia Marcaria 2026"
- ✅ **Login form** — acepta PINs 4-6 dígitos (fix sprint-6)
- ✅ **i18n status labels** — en portal cliente (Renovada, Registrada, Expirada)

---

## Findings clasificados

### P0 — Bugs críticos que rompen funcionalidad

#### F1. Sidebar cliente enlaza a `/documents` que no existe — 404 default Next
- **Síntoma:** click "Documentos" en sidebar → `/brand-ecosystem/<slug>/documents` → 404 negro inglés
- **Severidad:** P0 — afecta a TODOS los clientes, en TODAS las sesiones, el primer día
- **Root cause:** sidebar tiene href hardcodeado pero la página `documents/page.tsx` no existe
- **Fix:** crear `app/brand-ecosystem/[tenant-slug]/documents/page.tsx` con lista de documentos del tenant filtrada por permisos. O remover el link del sidebar hasta que exista.
- **Estimación:** 1-2 días (crear página completa) / 5 min (remover link)

#### F2. Página Contratos cliente dice "0 contratos vigentes" cuando hay 3
- **Síntoma:** `/brand-ecosystem/grupo-norteno/contratos` muestra "Sin contratos disponibles" pese a que DB tiene 3 contratos ACTIVE para grupo-norteno
- **Root cause:** mismatch de nombre de cookie. `lib/auth/api-helpers.ts:96` lee `cookies['client-token']` pero login y layout usan `promark-client-token`. API devuelve 401, el client component cae al estado vacío silenciosamente
- **Fix:** una línea en `lib/auth/api-helpers.ts`: `token = cookies['promark-client-token']`
- **Estimación:** 5 minutos
- **Impacto colateral:** todos los endpoints `/api/client/<slug>/*` que dependen de `requireClientApiAuth` probablemente fallan igual

#### F3. `notFound()` genera 404 default Next en portal cliente
- **Síntoma:** cuando un role no autorizado intenta acceder a una página (e.g. VIEWER → `/contratos`), el server llama `notFound()` y el usuario ve la pantalla negra inglesa "404 This page could not be found"
- **Severidad:** P0 — primera impresión rota para clientes legales
- **Fix:** crear `app/brand-ecosystem/[tenant-slug]/not-found.tsx` branded en español, con el sidebar del tenant y mensaje "No tienes acceso a este módulo. Contacta a tu administrador."
- **Estimación:** 1-2 horas

#### F4. Auditoría manual de DB requerida — versionado de documentos hardcoded
- **Síntoma:** `POST /api/tenants/[id]/documents/upload` siempre setea `version_number: 1, is_latest_version: true`
- **Severidad:** P0 para cliente legal real — sin esto, no pueden actualizar contratos
- **Fix:** transacción que busque última versión por entity+filename, demote `is_latest_version`, crea nueva con +1
- **Estimación:** 2-3 días (incluyendo UI de versiones)

---

### P1 — Bugs serios pero no bloqueantes

#### F5. Login page no redirige cuando ya hay sesión activa
- **Síntoma:** loguearte, cerrar pestaña, volver a `/brand-ecosystem/<slug>/login` → ves sidebar autenticado + formulario de login al mismo tiempo
- **Fix:** server-side check del JWT en la página login; si válido, `redirect()` a `/panel`
- **Estimación:** 30 min

#### F6. VIEWER ve "Alertas" en sidebar con badge "4" pero click → "Su rol no tiene acceso"
- **Síntoma:** señal mixta — el badge da curiosidad pero no se puede entrar
- **Fix:** ocultar item del sidebar cuando `role === CLIENT_VIEWER` (paralelo a cómo ya se oculta Contratos). El layout ya pasa role al ClientSidebar.
- **Estimación:** 15 min

#### F7. Estado de marca en INGLÉS en Promark side
- **Síntoma:** `/tenants/<id>/brands` tabla muestra `RENEWED`, `REGISTERED`, `EXPIRED` (enum values)
- **Comparación:** portal cliente sí usa `Renovada`, `Registrada`, `Expirada`
- **Fix:** wire `BRAND_STATUS_LABELS` (de `lib/i18n/status-labels.ts`) en la tabla Promark
- **Estimación:** 30 min

#### F8. Entity types en alertas en INGLÉS
- **Síntoma:** página `/alerts` muestra `BRAND`, `DOCUMENT`, `CONTRACT` debajo del nombre del entity. Debería ser `Marca`, `Documento`, `Contrato`.
- **Fix:** map de entity_type → label en español
- **Estimación:** 15 min

#### F9. Inconsistencia de nombres de rutas: español/inglés mezclados
- **Inventario:**
  - `/brands` (inglés) / sidebar dice "Marcas"
  - `/alerts` (inglés) / sidebar dice "Alertas"
  - `/documents` (inglés, NO existe) / sidebar dice "Documentos"
  - `/contratos` (español ✓)
  - `/tenants/<id>/brands` (inglés)
  - `/tenants/<id>/contracts` (inglés, NO existe — la real es `/tenants/<id>/contracts/page.tsx`)
- **Fix recomendado:** estandarizar a español en URLs visibles al usuario (cliente), mantener inglés en URLs internas Promark si es preferencia técnica. O todo en inglés. Decidir una convención.
- **Estimación:** 1-2 horas (rename + redirects de compatibilidad)

#### F10. Counts inconsistentes entre Panel y sidebar
- **Síntoma:** Panel del tenant Grupo Norteño dice "ALERTAS CRÍTICAS: 3" en KPIs, pero el badge del sidebar dice "4"
- **Posibles causas:** uno cuenta solo "críticas" (e.g. en <15 días), el otro todas. Pero entonces necesita una etiqueta clara.
- **Fix:** unificar criterio o etiquetar claramente "críticas (≤15d)" vs "activas (todas)"
- **Estimación:** 30 min

#### F11. Etiquetas truncadas en KPI cards del tenant panel
- **Síntoma:** "MARCAS POR ...", "MARCAS VEN...", "CONTRATOS...", "ALERTAS CRÍ..."
- **Root cause:** cards demasiado angostas para 5 KPIs en una fila
- **Fix:** o reducir a 4 KPIs, o cards más anchas (grid responsive), o tooltip on hover
- **Estimación:** 30 min

---

### P2 — UX gaps / polish

#### G1. No hay botón "+ Nuevo Cliente" visible en `/tenants`
- README dice SUPERADMIN puede crear tenants. La lista actual solo tiene rows existentes + "Gestionar". Sin botón de creación.
- Probablemente existe el endpoint pero falta el botón + modal en UI.

#### G2. Login redirige a `/portal` que redirige a `/brands` en lugar de `/panel`
- Después de login, lleva al catálogo de marcas, no al dashboard del cliente. Si el dashboard es la cara del producto, debería ser el landing.

#### G3. Typos en labels y headers
- "Catalogo" → "Catálogo"
- "Expiracion" → "Expiración"
- "Sin descripcion" → "Sin descripción"
- Múltiples lugares — un pase de copy-edit completo

#### G4. Tabla detalle de marca: "Empresa" aparece dos veces
- Card "Empresa" arriba + subtítulo de marca abajo de su nombre. Redundante.

#### G5. Label "Expirada" duplicada en detalle de marca
- Badge en esquina superior + texto debajo. Una sola.

#### G6. Clases IMPI muestran "Sin descripcion"
- La clase número 29 aparece como "29 Sin descripcion". Pero existe una lista oficial IMPI ("Carnes, pescados, aves..."). Falta seed/lookup.

#### G7. Donut chart leyenda inconsistente
- Muestra solo "Registrada / Renovada / Vencida". Falta "Solicitada" pese a que en /brands hay marcas con estado Solicitada (Del Huerto en Alimentos Pacífico).

#### G8. Vencimientos próximos chart difícil de leer
- Eje X tiene 24 meses pero el chart solo muestra ~2 barras. Mejor: timeline horizontal con marcas de tiempo y nombres de las marcas que vencen.

#### G9. "Actividad reciente" formato extraño
- "Sistema Creó (Contrato) Licencia interna - Logística" — Sistema y Creó están sin sintaxis natural
- Mejor: "Hace 2h • Contrato creado: Licencia interna - Logística"

#### G10. Date format "22/5/2026"
- Locale `es-MX` usa "22 de mayo de 2026" o "22/05/2026" con leading zeros. El formato actual sin leading zero es inconsistente.

#### G11. No hay logo Promark real
- Header usa solo texto "Promark®" en cliente Promark side. Footer cliente igual. El favicon es el PM provisional. Falta identidad visual real.

#### G12. Tenant detail breadcrumb pierde info con "..."
- En catálogo marcas Promark, breadcrumb dice "Clientes > ... > Marcas" — el "..." oculta el nombre del tenant. Confuso si tienes múltiples pestañas abiertas.

#### G13. Alertas "vencida" no muestran
- Tenant1 tiene 1 marca vencida -45d (NortePremium). El panel dice "MARCAS VENCIDAS: 1" pero la lista de alertas no la incluye. Solo aparecen alertas futuras.
- Definir: ¿las marcas vencidas son alertas resueltas o pendientes? Si el cliente debe actuar, deberían aparecer.

#### G14. No hay forma de loguearse a otro tenant sin clear cookies manualmente
- Si vas de grupo-norteno → alimentos-pacifico, te quedas en la sesión vieja. No hay botón "Cerrar sesión" visible en el sidebar.
- Footer dice "Admin Cliente Norteño / Administrador" sin clickeabilidad.

---

### P3 — Nice-to-have / Sprint 8+

#### N1. Exports a PDF/Excel
- Catálogo de marcas, reporte de alertas, listado de contratos → exportar a PDF y Excel
- Despachos legales viven en estos formatos

#### N2. Búsqueda global
- Solo hay búsqueda dentro de cada lista. Buscar por nombre de marca/contrato/empresa desde cualquier vista sería gran feature.

#### N3. Notificaciones email reales
- Sprint 6 dejó `RESEND_API_KEY` opcional. Activar con dominio verificado en producción para que las alertas lleguen al inbox.

#### N4. Audit log visible
- `AuditLog` model existe en schema pero no hay UI para que cliente o Promark vea histórico de cambios.

#### N5. Editor de branding del tenant
- Cliente espera personalizar logo, colores, mensaje de bienvenida.
- Modelo `TenantVersion` ya existe. Falta el editor.

#### N6. Comments/notas en marcas y contratos
- Un legal va a querer dejar notas internas sobre un asunto. Hoy no hay forma.

#### N7. Histórico de versiones de documentos
- Sigue al F4. Una vez resuelto el bug del versionado, falta UI para "ver versión anterior" y "descargar v1, v2, v3..."

#### N8. Filtros guardados
- Power users querrán "todas las marcas registradas que vencen en próximos 90 días" como vista guardada.

---

## Recomendación de Sprint 7

Propongo dividir en 3 oleadas:

### Ola 1 — Quick wins (2-3 días)
Cosas pequeñas que devuelven mucha legitimidad al producto:

| # | Item | Tiempo |
|---|------|--------|
| F2 | Fix cookie name en api-helpers | 5 min |
| F1 | Crear página `/documents` cliente (o remover link) | 4-8 h |
| F3 | Branded `not-found.tsx` para portal cliente | 1-2 h |
| F5 | Login redirect si JWT válido | 30 min |
| F6 | Ocultar "Alertas" del sidebar VIEWER | 15 min |
| F7 | i18n labels Promark side marcas | 30 min |
| F8 | Map entity types en alertas | 15 min |
| F9 | Estandarizar rutas español | 1-2 h |
| F10 | Unificar count de alertas críticas | 30 min |
| F11 | Fix KPI labels truncadas | 30 min |
| G1 | "+ Nuevo Cliente" button en `/tenants` | 1-2 h |
| G2 | Cambiar redirect post-login a `/panel` | 5 min |
| G3 | Pase completo de typos | 2 h |
| G4, G5 | Detalle marca: deduplicar Empresa y badge | 30 min |
| G11 | Logo Promark + favicon final | depende del diseño |
| G14 | Botón "Cerrar sesión" en sidebar | 30 min |

**Subtotal Ola 1: 2-3 días.** Después de esto el demo se ve "profesional".

### Ola 2 — Funcional crítico (1.5-2 semanas)
| # | Item | Tiempo |
|---|------|--------|
| F4 | Versionado real de documentos + UI | 3 días |
| N5 | Editor de branding tenant | 3-5 días |
| N4 | Audit log visible en UI | 1-2 días |
| N1 | Exports PDF/Excel (catálogo marcas + alertas + contratos) | 2-3 días |
| N3 | Resend en producción + email templates ES | 1 día |
| G6 | Catálogo IMPI con descripciones | 1 día |

**Subtotal Ola 2: 1.5-2 semanas.** Después de esto, el producto está completo para piloto.

### Ola 3 — Design System (2-3 semanas)
Solo cuando Ola 1 y 2 estén verdes. Construir tu sistema visual sobre una base funcional sólida tiene mejor ROI que sobre una base con bugs.

| # | Item | Tiempo |
|---|------|--------|
| - | Auditoría visual completa (consistencia spacing, colors, type) | 1-2 días |
| - | Design tokens en `@theme inline` enriquecidos | 1 día |
| - | Componentes propios: BrandCard, AlertCard, ContractCard, HolderChip, etc | 4-5 días |
| - | Estados vacíos con ilustración | 2 días |
| - | Storybook o Ladle docs | 2-3 días |
| - | Guía de uso `design-system/README.md` | 1 día |
| - | Aplicar nuevo system a todas las páginas | 3-5 días |

**Subtotal Ola 3: 2-3 semanas.**

---

## Estimación total

- **Mínimo para demo decente:** Ola 1 = 2-3 días
- **Demo a cliente legal piloto:** Ola 1 + Ola 2 = 2.5-3 semanas
- **Producto comercializable serio:** Ola 1 + Ola 2 + Ola 3 = 5-6 semanas total

---

## Findings de seguridad (revisión rápida)

- ✅ JWT cookie `HttpOnly: true` (no accesible vía `document.cookie`)
- ✅ Tenant isolation enforced en backend (no solo frontend)
- ✅ Role enforcement server-side (VIEWER bloqueado en /alerts y /contratos)
- ⚠️ Cookie no tiene `Secure: true` explícito (revisar — Vercel default debería tenerlo)
- ⚠️ No probé CSRF protection — los endpoints POST cliente usan cookie auth, deberían tener token de doble submit
- ⚠️ No probé rate limiting en `/api/auth/client-pin` — un atacante podría brute-forcear PINs de 4 dígitos (10,000 combinaciones)
- ⚠️ No verifiqué RLS policies de Supabase (tenant_id check en cada query SQL). Hay que verificar `lib/prisma/*` que SIEMPRE filtre por tenant_id.

Estos deberían entrar al Sprint 9 (Hardening) explícitamente.
