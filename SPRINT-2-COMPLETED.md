# Sprint 2 — Brand Management — Completed

**Platform**: Promark® — Brand Intelligence SaaS  
**Fecha**: 2026-05-21  
**Rama**: `sprint-2/brand-management`  
**PR**: https://github.com/futuristmx/promark-ecosystems/pull/1

---

## Criterios de Aceptacion

| # | Criterio | Status | Evidencia |
|---|----------|--------|-----------|
| 1 | SUPERADMIN puede crear Holding → Company → Brand completo | ✅ PASS | Formularios funcionales en `/tenants/[id]/structure`, `/tenants/[id]/brands/new` con validacion Zod. API POST endpoints con permisos verificados. |
| 2 | La marca creada aparece en listado con indicador de vigencia correcto | ✅ PASS | Componentes `VigencyBadge` y `VigencyDot` con logica: verde (>90d), amarillo (31-90d), naranja (1-30d), rojo (vencida), gris (cancelada/pendiente). |
| 3 | La edicion de una marca genera entrada en BrandHistory automaticamente | ✅ PASS | `PUT /api/tenants/[id]/brands/[brand-id]` captura `previous_state` antes del update y `new_state` despues, crea BrandHistory con `event_type: STATUS_CHANGE`. |
| 4 | Usuario cliente ADMIN ve su catalogo completo en su portal | ✅ PASS | `/brand-ecosystem/[slug]/brands` muestra todas las marcas del tenant con filtros. CLIENT_ADMIN tiene acceso completo. |
| 5 | Usuario cliente LEGAL_REP solo ve marcas donde es representante | ⚠️ TODO | Estructura preparada con comentario TODO — requiere mecanismo de vinculacion usuario-holder (actualmente muestra todas las marcas). |
| 6 | Usuario cliente VIEWER ve catalogo sin historial ni documentos | ✅ PASS | En brand detail, CLIENT_VIEWER nunca ve secciones de historial, documentos ni contratos independientemente del tenant config. |
| 7 | Los filtros de estado y vigencia funcionan correctamente | ✅ PASS | Filtros por company, legal_status, vigency (active/expiring/expired) y busqueda por nombre. Vigency filter en API usa `expiration_date` con rangos de 90 dias. |
| 8 | Un ASSISTANT de Promark no puede crear ni editar marcas | ✅ PASS | Botones de crear/editar ocultos para rol ASSISTANT en todas las vistas. API endpoints verifican permisos via `checkPermission()`. |
| 9 | El layout del portal cliente aplica branding del tenant | ✅ PASS | Sidebar con logo (desde `config.branding.logo_url`), color primario aplicado via CSS custom property `--tenant-primary`, nombre del tenant desde `company_display_name`. |
| 10 | Todos los forms validan con Zod antes de hacer request | ✅ PASS | react-hook-form + zodResolver en create/edit brand y create holder. Schemas Zod v4 con enums de Prisma. |

**Resultado: 9/10 criterios PASS, 1 TODO (LEGAL_REP filtering)**

---

## Archivos Creados (50 cambios)

### API Routes (8 archivos, 17 handlers)
| Ruta | Handlers |
|------|----------|
| `app/api/tenants/[id]/holdings/route.ts` | GET, POST |
| `app/api/tenants/[id]/holdings/[holding-id]/route.ts` | GET, PUT |
| `app/api/tenants/[id]/companies/route.ts` | GET, POST |
| `app/api/tenants/[id]/companies/[company-id]/route.ts` | GET, PUT |
| `app/api/tenants/[id]/brands/route.ts` | GET, POST |
| `app/api/tenants/[id]/brands/[brand-id]/route.ts` | GET, PUT, DELETE |
| `app/api/tenants/[id]/holders/route.ts` | GET, POST |
| `app/api/tenants/[id]/holders/[holder-id]/route.ts` | GET, PUT |

### Paginas Promark Admin (9 archivos)
| Ruta | Tipo |
|------|------|
| `app/(promark)/tenants/[tenant-id]/layout.tsx` | Server — tenant context |
| `app/(promark)/tenants/[tenant-id]/structure/page.tsx` | Server — corporate tree |
| `app/(promark)/tenants/[tenant-id]/brands/page.tsx` | Client — brand catalog |
| `app/(promark)/tenants/[tenant-id]/brands/new/page.tsx` | Client — create form |
| `app/(promark)/tenants/[tenant-id]/brands/[brand-id]/page.tsx` | Server — brand detail |
| `app/(promark)/tenants/[tenant-id]/brands/[brand-id]/edit/page.tsx` | Client — edit form |
| `app/(promark)/tenants/[tenant-id]/holders/page.tsx` | Client — holders list |
| `app/(promark)/tenants/[tenant-id]/holders/new/page.tsx` | Client — create holder |
| `app/(promark)/tenants/[tenant-id]/holders/[holder-id]/page.tsx` | Server — holder detail |

### Paginas Portal Cliente (3 archivos)
| Ruta | Tipo |
|------|------|
| `app/brand-ecosystem/[tenant-slug]/brands/page.tsx` | Server — brand catalog |
| `app/brand-ecosystem/[tenant-slug]/brands/[brand-id]/page.tsx` | Server — brand detail |
| `app/brand-ecosystem/[tenant-slug]/brands/brand-filters.tsx` | Client — filter bar |

### Componentes Compartidos (8 archivos)
| Archivo | Proposito |
|---------|-----------|
| `components/promark-sidebar.tsx` | Sidebar con sub-nav por tenant |
| `components/vigency-badge.tsx` | Badge + dot de vigencia |
| `components/brand-vigency-dot.tsx` | Dot de vigencia (portal cliente) |
| `components/breadcrumb.tsx` | Breadcrumb con chevrons |
| `app/brand-ecosystem/[tenant-slug]/client-sidebar.tsx` | Sidebar de portal cliente |
| `lib/auth/api-helpers.ts` | Auth helpers para API routes |
| `lib/auth/client-session.ts` | Session helper para portal cliente |
| `lib/validations/brand.schema.ts` | Schemas Zod para todas las entidades |

### UI Components (shadcn/ui — 12 archivos)
button, input, label, select, textarea, badge, table, dialog, card, tabs, separator, dropdown-menu, sheet

---

## Build

- **TypeScript**: 0 errors (`tsc --noEmit`)
- **Production build**: clean (28 routes registered)
- **Routes**: 12 API + 9 Promark admin + 4 Client portal + 3 Auth/misc

---

Sprint 2 — BRAND MANAGEMENT COMPLETE — 2026-05-21
