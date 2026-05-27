# Hito — Ola G completa (UI/UX premium + CRUD + IMPI)

**Fecha:** 2026-05-27
**Branch:** `main` (todo mergeado)
**PRs cubiertos:** #43 → #60 (18 PRs en una sesión)

## Estado del repo al cierre

- `main` actualizado y sincronizado con `origin/main`
- 2 migraciones aplicadas a Supabase:
  - `20260527042436_add_use_declaration_date`
  - `20260527043202_expand_brand_types_impi`
- `tsc --noEmit` limpio
- Sin PRs abiertos
- Sin branches locales fuera de `main`

## Cambios entregados, agrupados por área

### Sidebar Promark (staff)
- #43 — chip CLIENTE con color del tenant + nombre
- #49 — chip CLIENTE usa tinte secundario derivado del primario
- #53 — stripe activa 2px (era 3px) + bg gradient claro→transparente
- #55 — chip CLIENTE es link a `/tenants/[id]/configuracion`
- #58 — items del menú del cliente usan color del tenant + reorden (Vista General, Estructura, Portafolio, Financiero, Alertas, Actividad) + Configuración separada al pie

### Portal cliente
- #43 — login con logo + nombre del tenant, color primario en focus/CTA, contador de intentos
- #43 — panel cliente con 4 KPIs (marcas, contratos, alertas, vencidas)
- #43 — catálogo de marcas con paginación cliente (24/pág)
- #43 — empty state premium en contratos
- #43 — alertas agrupadas por urgencia (≤30d / 30–90d / >90d)
- #43 — breadcrumbs en detalle de marcas y contratos
- #60 — sidebar sticky (`h-screen`) + logo del tenant también al pie

### Portafolio (Marcas / Titulares / Contratos / Licencias)
- #47 — cards por default + contenedor hueso
- #51 → #54 — iteraciones de color de cards (terminamos en marfil cálido uniforme con borde gris arena + hover ámbar)
- #56 — contenedor gris arena con override explícito de `backgroundImage`
- #46 — fix de contraste + hover en CSV entity selector

### Estructura (Holdings / Empresas)
- #46 — contraste del label "ENTIDAD CSV" + hover en switcher
- #50 — separación generosa entre Entidad CSV y lista de holdings
- #57 — botón Eliminar en edit-holding y edit-empresa sheets

### Clientes (tenants)
- #57 — DELETE individual + bulk delete + selección con checkboxes (cards y tabla)

### Marcas (brand domain)
- #59 — campo `use_declaration_date` con migration + UI + CSV
- #60 — 14 tipos de marca según catálogo IMPI (de 7 a 14), con labels ES

### Financiero
- #58 — gráfica modernizada (AreaChart con gradient stroke, glow SVG, fondo radial marino, filtros Cantidad/Costo × 30/60/90d)
- #58 — KPI con fuente adaptativa para strings largos (MXN)
- #48 — card de "Configuración de valores monetarios" con gradient azulgris-niebla

### Alertas
- #43 — dedup ×N para alertas idénticas (Promark y cliente)
- #48 — toggle switch en reglas de alerta (era botón + badge)
- #48 — breadcrumb legible (color `#8FB6C7` → `#355B6F`)

### Design System
- #44 — rollout `useToast` en mutaciones del staff (profile, password reset, contract detail, structure forms)
- #45 — `<DsSkeleton/>` + variantes (`DsKpiSkeleton`, `DsCardSkeleton`, `DsTableSkeleton`, etc.) + 10 `loading.tsx` on-brand
- #58 — `DsColumn.header` acepta `ReactNode` (para checkboxes de selección)

### Backend / API nuevos
- `DELETE /api/tenants/[id]` (hard delete con cascada — SUPERADMIN)
- `POST /api/tenants/bulk-delete`
- `DELETE /api/tenants/[id]/holdings/[holding-id]` (falla con 409 si tiene empresas)
- `DELETE /api/tenants/[id]/companies/[company-id]` (falla con 409 si tiene marcas o subsidiarias)
- `/api/tenants/[id]/info` expone `branding.primary_color` y `logo_url`

### Bugs resueltos
- #43 — botón refresh con cookie name fix
- #57 — KPI "Alertas críticas" del dashboard apuntaba a `/alertas` (404) → ahora `/tenants`

## Backlog vivo (sugerencias para mañana)

Cosas que mencioné en el camino y quedan pendientes:

- Mobile responsive del portal cliente (panel, brands, contratos, alerts)
- WCAG AA accessibility pass (foco, contraste 4.5:1, aria-labels)
- Bulk delete en marcas/holdings/empresas (mismo patrón que clientes)
- Soft delete con papelera 30 días en lugar de hard delete
- `useToast` en mutaciones restantes (brand create/edit, holder create, branding edit, etc.)
- Resolver el bug de Turbopack con `®` en path local

## Notas técnicas

- Hay un bug conocido de Turbopack con caracteres multibyte en el path (`®`). Solo afecta dev local; Vercel no se ve afectado. Si una pantalla muestra estilos viejos, primero hard reload + `rm -rf .next && npm run dev`.
- Las migraciones se aplicaron vía `DIRECT_DATABASE_URL` (session pooler 5432) como manda `AGENTS.md`. El runtime sigue usando `DATABASE_URL` (transaction pooler 6543).
