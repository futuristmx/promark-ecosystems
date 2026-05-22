# Sprint 5 — Dashboard + Visualizaciones

Rama: `sprint-5/dashboard-visualizations`

## Resumen de archivos por commit

### Commit 1 — `a1a3732` API endpoints (entregado previamente)
- `app/api/dashboard/route.ts`
- `app/api/tenants/[id]/dashboard/route.ts`
- `app/api/tenants/[id]/graph/route.ts`
- `app/api/client/[tenant-slug]/dashboard/route.ts`
- `lib/dashboard/tenant-aggregates.ts`
- `lib/dashboard/tenant-graph.ts`

### Commit 2 — `1fa6aa9` Charts y KPI (entregado previamente)
- `components/dashboard/kpi-card.tsx`
- `components/dashboard/kpi-grid.tsx`
- `components/dashboard/recent-activity.tsx`
- `components/dashboard/charts/status-donut.tsx`
- `components/dashboard/charts/vigency-timeline.tsx`
- `components/dashboard/charts/impi-class-bar.tsx`
- `components/dashboard/charts/top-tenants-bar.tsx`

### Commit 3 — `43678e4` Panel Promark con métricas reales
- `app/(promark)/dashboard/page.tsx` (refactor — consulta Prisma directo)
- `app/(promark)/tenants/[tenant-id]/panel/page.tsx` (nuevo, server component)
- `app/(promark)/tenants/[tenant-id]/panel/tenant-panel-view.tsx` (nuevo, client, Tabs)

### Commit 4 — `fda8ff6` Grafo relacional con @xyflow/react
- `components/dashboard/graph/tenant-graph.tsx`
- `components/dashboard/graph/graph-toolbar.tsx`
- `components/dashboard/graph/node-detail-sheet.tsx`
- `app/(promark)/tenants/[tenant-id]/panel/tenant-panel-view.tsx` (placeholder reemplazado por `<TenantGraph>`)

### Commit 5 — Panel cliente, sidebar, seed
- `app/brand-ecosystem/[tenant-slug]/panel/page.tsx` (nuevo, ramifica por rol)
- `components/promark-sidebar.tsx` (agrega "Vista general" arriba de tenantSubNav)
- `app/brand-ecosystem/[tenant-slug]/client-sidebar.tsx` (agrega "Panel" arriba del nav)
- `prisma/seed.ts` (agrega BrandClass con clases IMPI variadas por marca)
- `SPRINT-5-COMPLETED.md` (este archivo)

## Criterios de aceptación

| # | Criterio | Status | Notas |
|---|----------|--------|-------|
| 1 | Endpoint `/api/dashboard` agregado con RLS (SUPERADMIN/LAWYER) | ✅ | Verifica `getPromarkSession` y rol |
| 2 | Endpoint `/api/tenants/[id]/dashboard` y `/graph` por cliente | ✅ | Auth promark + tenant existence check |
| 3 | Endpoint cliente `/api/client/[tenant-slug]/dashboard` ramifica por rol | ✅ | VIEWER, LEGAL_REP, ADMIN |
| 4 | KPI cards y charts con recharts | ✅ | StatusDonut, VigencyTimeline, ImpiClassBar, TopTenantsBar |
| 5 | Panel Promark `/dashboard` con métricas reales | ✅ | 4 KPI + StatusDonut + TopTenantsBar + RecentActivity |
| 6 | Panel cliente `/tenants/[id]/panel` con Tabs (general/grafo/árbol) | ✅ | Tabs de Base UI; árbol con `<details>` |
| 7 | Grafo relacional @xyflow/react con filtros + búsqueda + sheet | ✅ | Layout por capas, MiniMap, NodeDetailSheet |
| 8 | Panel cliente `/brand-ecosystem/[slug]/panel` ramifica por rol | ✅ | VIEWER ve 2 KPI; ADMIN/LEGAL_REP ven aggregates |
| 9 | Sidebar Promark y cliente con entradas de Panel | ✅ | LayoutDashboard icon, posición superior |
| 10 | Seed enriquecido (clases IMPI, expiraciones, status variado) | ✅ | 5 marcas/tenant, 3+ clases IMPI distintas, expiraciones future/past |

10/10 ✅

## Resultado del build

- Comando: `npx next build` (Next 16.2.6 con Turbopack)
- Compilación: `✓ Compiled successfully in ~12s`
- Sin errores ni warnings de TypeScript/ESLint
- Rutas dinámicas relevantes creadas:
  - `ƒ /dashboard`
  - `ƒ /tenants/[tenant-id]/panel`
  - `ƒ /brand-ecosystem/[tenant-slug]/panel`
  - `ƒ /api/dashboard`
  - `ƒ /api/tenants/[id]/dashboard`
  - `ƒ /api/tenants/[id]/graph`
  - `ƒ /api/client/[tenant-slug]/dashboard`

Nota: el build se ejecuta vía rsync del proyecto a `/tmp/pmark` porque el path con el carácter `®` rompe Turbopack (`ident.rs:354`). El código no usa esa ruta — es solo el directorio padre del repo local.

## Descripción del grafo

- **Tipos de nodo:** HOLDING (slate-700, 180px), COMPANY (blue-600), BRAND (green-600), HOLDER (purple-500), CONTRACT (orange-500), ALERT (red-500).
- **Layout:** capas horizontales por tipo. Holdings arriba (y=0), Companies (y=160), Brands (y=320), Holders/Contracts (y=480), Alerts (y=600). Distribución horizontal centrada.
- **Aristas:** `HOLDING_COMPANY`, `COMPANY_BRAND`, `BRAND_HOLDER`, `BRAND_CONTRACT`, `BRAND_ALERT`. Estilo `smoothstep` gris.
- **Filtros (toggles redondos):** "Mostrar titulares", "Mostrar contratos", "Mostrar alertas". Holdings/Companies/Brands siempre visibles. Al apagar un toggle el filtro `useMemo` reduce nodos y oculta aristas huérfanas.
- **Búsqueda:** Input "Buscar en el grafo..." filtra por `label.toLowerCase().includes(query)`.
- **Controles:** Zoom in/out/fit-view via `useReactFlow()`; Controls y MiniMap nativos de xyflow; `nodesDraggable={false}`, `fitView`, `hideAttribution`.
- **NodeDetailSheet:** click en nodo abre Sheet con tipo, label, estado i18n, metadata y botón "Ver detalle" enlazando a la ruta de la entidad (`/tenants/[id]/brands/[brand-id]`, etc.).

## Estructura de árbol (Vista de árbol)

`<details>` HTML anidados: Holding → Empresa → Marca. Holdings expandidos por defecto; empresas y marcas cerrados. Cada nodo muestra contador de hijos y la marca incluye su estado legal traducido al ES-MX.

## Lectura por rol — Panel cliente

| Rol | Vista |
|-----|-------|
| `CLIENT_VIEWER` | 2 KPI (Mis marcas, Mis alertas) acotadas por `brandIdsForLegalRep` |
| `CLIENT_LEGAL_REP` | 4 KPI + StatusDonut + VigencyTimeline + RecentActivity, todo filtrado por brandIds asignados |
| `CLIENT_ADMIN` | Mismos 4 KPI + charts pero con todo el tenant |

No hay vista de grafo en el portal cliente (intencional).

## Desviaciones

- Path build: el carácter `®` causa panic en Turbopack; build se ejecuta sobre copia en `/tmp/pmark`. No afecta producción ni el código fuente.
- `BrandClassStatus` no tenía `REGISTERED`; el seed usa `ACTIVE`/`PENDING`.
- `tenant-panel-view.tsx` recibe `tenantId` pero lo deja sin uso directo (se delega a `useParams` en `TenantGraph`); el prop se mantiene para extensibilidad y se marca como `void tenantId` para evitar warning de unused.
