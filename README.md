# Promark® Brand Intelligence Platform

Plataforma SaaS multitenancy para gestión de inteligencia marcaria. Diseñada para
despachos legales y áreas legales corporativas que administran carteras de marcas,
contratos, licencias y alertas de vigencia para múltiples clientes.

Cada cliente (tenant) tiene su propio portal con branding personalizado, usuarios con
PIN+JWT, y visibilidad controlada a su catálogo de marcas, contratos y documentos.

---

## Stack tecnológico

- **Next.js 16** con App Router + Turbopack
- **Prisma 7** con `@prisma/adapter-pg`
- **Supabase Pro**: PostgreSQL, Auth, Storage, RLS
- **Tailwind CSS v4** + shadcn/ui (componentes base)
- **@xyflow/react** — grafo relacional de estructura corporativa
- **Recharts** — visualizaciones del panel
- **Resend** — emails transaccionales (opcional)
- **Vercel** — deploy + cron jobs

---

## Variables de entorno requeridas

```
DATABASE_URL                       # Transaction pooler Supabase (puerto 6543)
DIRECT_DATABASE_URL                # Session pooler Supabase (puerto 5432) — solo migraciones
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY          # Server-side; nunca exponer
JWT_SECRET                         # 32+ caracteres aleatorios
CRON_SECRET                        # Bearer token para endpoints /api/cron/*
NEXT_PUBLIC_APP_URL                # https://... — usado en emails
NEXT_PUBLIC_APP_NAME               # "Promark Ecosystems"
RESEND_API_KEY                     # Opcional — sin él, emails se loguean
RESEND_FROM_EMAIL                  # Por defecto: alertas@promark.mx
```

Ver `DEPLOYMENT.md` para los detalles de cada variable.

---

## Desarrollo local

```bash
npm install
cp .env.example .env       # llenar con valores reales
npx prisma db push         # sincronizar schema con la DB
npm run db:seed            # cargar datos demo (Grupo Norteño + Alimentos del Pacífico)
npm run dev                # http://localhost:3000
```

---

## Producción

```bash
npm run build              # corre prisma generate + next build
npm start
```

Deploy automático en Vercel al hacer push a `main`.

URL de producción: **https://promark-ecosystems.vercel.app**

---

## Estructura de roles

### Promark (staff interno)
| Rol | Permisos |
|---|---|
| `SUPERADMIN` | CRUD completo en todos los tenants + admin global |
| `LAWYER` | CRUD completo en contratos, licencias y marcas |
| `BRAND_ANALYST` | Lectura + creación de marcas y contratos |
| `ASSISTANT` | Solo lectura |

### Cliente (portal)
| Rol | Permisos |
|---|---|
| `CLIENT_ADMIN` | Ve y descarta alertas de su tenant; ve todo el catálogo |
| `CLIENT_LEGAL_REP` | Solo ve marcas/contratos de los titulares asignados |
| `CLIENT_VIEWER` | Solo lectura de marcas, sin alertas ni contratos |

Promark usa Supabase Auth (email + password). Clientes usan PIN+JWT custom (8h).

---

## Agregar un nuevo cliente (tenant)

1. Loguearse como SUPERADMIN en https://promark-ecosystems.vercel.app/login
2. Ir a **Clientes** → botón **Nuevo cliente** (o `POST /api/tenants`)
3. Llenar: nombre, slug (autogenerado si se omite), color primario, logo URL opcional
4. Configurar `tenant.config.features`:
   - `show_contracts` — exponer contratos en el portal
   - `show_documents` — permitir ver documentos
   - `allow_document_download` — permitir descarga
5. Crear usuarios cliente con PIN de 4-6 dígitos
6. Asignar marcas/holders a usuarios CLIENT_LEGAL_REP vía `UserClientHolder`

El cliente accede en `https://promark-ecosystems.vercel.app/brand-ecosystem/{slug}/login`.

---

## Cron jobs

Configurados en `vercel.json`:

| Path | Schedule | Propósito |
|---|---|---|
| `/api/cron/check-alerts` | `0 14 * * *` (diario 14:00 UTC) | Detector de vencimientos |
| `/api/health` | `0 * * * *` (hourly) | Smoke test de conectividad a DB |

Ambos requieren header `Authorization: Bearer $CRON_SECRET`.
