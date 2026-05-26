# Promark® — Guia de Diseno del Sistema UI

Referencia tecnica completa del design system. Todos los valores son exactos, extraidos del codigo fuente.

---

## 1. Sistema Cromatico

### 1.1 Primarios — Azules profundos

| Token CSS               | Hex       | Nombre               | Uso principal                              |
|--------------------------|-----------|----------------------|--------------------------------------------|
| `--azul-noche`           | `#0B1F2A` | Azul Noche           | Dark mode bg, tooltips, gradientes oscuros |
| `--azul-marino-profundo` | `#0F2E3D` | Azul Marino Profundo | Sidebar bg, chart-1, KPI value default     |
| `--indigo-estrategico`   | `#1C3F55` | Indigo Estrategico   | Status active, chart-2, node process       |

### 1.2 Secundarios — Azules suaves

| Token CSS         | Hex       | Nombre        | Uso principal                        |
|--------------------|-----------|---------------|--------------------------------------|
| `--azul-pizarra`   | `#355B6F` | Azul Pizarra  | Text muted, eyebrow, chart-3, labels |
| `--azul-niebla`    | `#8FB6C7` | Azul Niebla   | Dark mode muted text, icon tint      |
| `--azul-hielo`     | `#DDEAF2` | Azul Hielo    | Info bg, chart tooltip, insight bg   |

### 1.3 Neutros calidos — Fondos y superficies

| Token CSS               | Hex       | Nombre             | Uso principal                           |
|--------------------------|-----------|--------------------|-----------------------------------------|
| `--marfil-calido`        | `#FBF6EC` | Marfil Calido      | App bg, sidebar text, donut table bg    |
| `--hueso`                | `#F1EDE3` | Hueso              | Card bg, KPI bg, DataTable bg, muted bg |
| `--gris-arena`           | `#E2DED6` | Gris Arena         | Borders, secondary bg, dividers         |
| `--gris-piedra-calido`   | `#C8C4B9` | Gris Piedra Calido | Soft text, sort icons, muted dots       |

### 1.4 Acentos

| Token CSS       | Hex       | Nombre      | Uso principal                                |
|------------------|-----------|-------------|----------------------------------------------|
| `--carbon`       | `#1A1E23` | Carbon      | Text header/body, titulos, valores en celdas |
| `--ambar-sutil`  | `#D39A2B` | Ambar Sutil | Primary CTA, ring, sidebar active, warnings  |

### 1.5 Estados

| Token CSS              | Hex       | Nombre            | Uso                        |
|-------------------------|-----------|-------------------|----------------------------|
| `--estado-critico`      | `#B42318` | Estado Critico    | Error, destructive, danger |
| `--estado-critico-bg`   | `#F9E8E5` | Estado Critico BG | Error badge background     |
| `--estado-exito`        | `#2F6B4F` | Estado Exito      | Success, sistema activo    |
| `--estado-exito-bg`     | `#E7F1EA` | Estado Exito BG   | Success badge background   |
| `--estado-info-bg`      | `#DDEAF2` | Estado Info BG    | Info backgrounds           |
| `--estado-info-text`    | `#1C3F55` | Estado Info Text  | Info text                  |

### 1.6 Colores adicionales hardcodeados

| Hex                          | Donde se usa                       |
|-------------------------------|------------------------------------|
| `#FFFFFF`                     | Primary foreground, input bg, node card bg |
| `#E0E4EB`                    | Dark mode foreground               |
| `rgba(251, 246, 236, 0.08)`  | Sidebar accent bg                  |
| `rgba(251, 246, 236, 0.10)`  | Sidebar nav item active bg         |
| `rgba(251, 246, 236, 0.12)`  | Sidebar border                     |
| `rgba(251, 246, 236, 0.72)`  | Sidebar nav item text inactive     |
| `rgba(251, 246, 236, 0.45)`  | Sidebar section label, logout text |
| `rgba(251, 246, 236, 0.50)`  | Sidebar trademark symbol           |
| `rgba(211, 154, 43, 0.30)`   | User card hover border (sidebar)   |
| `rgba(180, 35, 24, 0.15)`    | Logout hover bg (sidebar)          |

### 1.7 Gradientes oficiales

| Token CSS                            | Definicion                                               | Uso                |
|---------------------------------------|----------------------------------------------------------|--------------------|
| `--gradient-noche-marino`             | `135deg, #0B1F2A → #0F2E3D`                             | Sidebar background |
| `--gradient-marino-indigo`            | `135deg, #0F2E3D → #1C3F55`                             | Avatar fallback    |
| `--gradient-ambar-oro`                | `135deg, #D39A2B → #F2C16A`                             | Boton primario CTA |
| `--gradient-indigo-pizarra`           | `135deg, #1C3F55 → #355B6F`                             | Disponible         |
| `--gradient-niebla-hielo`             | `135deg, #8FB6C7 → #DDEAF2`                             | Disponible         |
| `--gradient-marfil-arena`             | `135deg, #FBF6EC → #E2DED6`                             | Disponible         |
| `--gradient-ocre-amarillo-palido`     | `135deg, #C7851F → #F5DEA2`                             | Disponible         |

### 1.8 Chart palette (secuencia ordenada)

| Variable     | Color                          | Hex       |
|--------------|--------------------------------|-----------|
| `--chart-1`  | Azul Marino Profundo           | `#0F2E3D` |
| `--chart-2`  | Indigo Estrategico             | `#1C3F55` |
| `--chart-3`  | Azul Pizarra                   | `#355B6F` |
| `--chart-4`  | Azul Niebla                    | `#8FB6C7` |
| `--chart-5`  | Ambar Sutil                    | `#D39A2B` |

### 1.9 Jerarquia visual (regla 60-75-15-25)

- 60-75% Marfil / neutros calidos (`#FBF6EC`, `#F1EDE3`, `#E2DED6`)
- 15-25% Azul marino / azul pizarra (`#0F2E3D`, `#1C3F55`, `#355B6F`)
- 5-10% Gris calido (`#C8C4B9`)
- 3-8% Ambar (`#D39A2B`)
- <2% Estados criticos (`#B42318`, `#2F6B4F`)

---

## 2. Tipografia

### 2.1 Fuentes

| Token           | Stack                                                                          |
|------------------|--------------------------------------------------------------------------------|
| `--font-sans`    | DM Sans, Open Sans, Manrope, -apple-system, BlinkMacSystemFont, Segoe UI      |
| `--font-heading` | DM Sans, Open Sans, Manrope, sans-serif                                        |
| `--font-mono`    | Geist Mono                                                                     |

**Feature settings:** `font-feature-settings: "ss01", "cv11"` en body.

### 2.2 Tamanios y pesos usados

| Contexto                  | Clase Tailwind                            | Tamano real       | Peso           | Extras                      |
|---------------------------|-------------------------------------------|-------------------|----------------|-----------------------------|
| Titulo pagina (h1)        | `text-3xl font-bold tracking-tight`       | 1.875rem / 30px   | 700            | `letter-spacing: -0.025em` |
| Seccion header            | `text-base font-semibold`                 | 1rem / 16px       | 600            |                             |
| Chart title               | `text-base font-bold uppercase`           | 1rem / 16px       | 700            | `tracking-wide (0.04em)`   |
| KPI value                 | `text-[2.5rem] font-extrabold`            | 2.5rem / 40px     | 800            | `tracking-tight`            |
| Body / cell text          | `text-sm`                                 | 0.875rem / 14px   | 400            |                             |
| Eyebrow                   | `text-[11px] font-semibold uppercase`     | 11px              | 600            | `tracking-[0.08em]`        |
| KPI label                 | `text-[10px] font-semibold uppercase`     | 10px              | 600            | `tracking-[0.1em]`         |
| Section label (sidebar)   | `text-[10px] font-semibold uppercase`     | 10px              | 600            | `tracking-[0.08em]`        |
| Badge / status            | `text-[11px] font-medium`                 | 11px              | 500            |                             |
| Vigency badge             | `text-xs font-medium`                     | 12px              | 500            |                             |
| Timestamp (timeline)      | `text-[11px]`                             | 11px              | 400            |                             |
| Tagline (sidebar)         | `text-[10px] uppercase tracking-wider`    | 10px              | 400            |                             |
| Nav item                  | `text-sm font-medium`                     | 14px              | 500            |                             |
| User name (sidebar)       | `text-sm font-semibold`                   | 14px              | 600            |                             |
| User role (sidebar)       | `text-[11px] font-medium uppercase`       | 11px              | 500            | `tracking-wider`            |

### 2.3 Tracking especial

| Selector       | Letter-spacing |
|----------------|----------------|
| `h1`           | `-0.025em`     |
| `h2`, `h3`     | `-0.02em`      |
| `.ds-label-uc` | `0.08em`       |
| KPI label      | `0.1em`        |
| Eyebrows       | `0.08em`       |

### 2.4 Patron uppercase

Las etiquetas de contexto siempre son `uppercase`:
- Eyebrows (`PageTitle.eyebrow`)
- Section labels del sidebar ("Workspace", "Cliente")
- KPI labels
- Chart titles
- Timeline category pills
- NodeCard type labels ("INPUT", "PROCESO", "OUTPUT")
- Clase `.ds-label-uc` para uso general: `font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em; color: #355B6F; font-weight: 600`

---

## 3. Espaciado y Layout

### 3.1 Padding de cards

| Variante     | Clase CSS          | Padding         |
|--------------|---------------------|-----------------|
| `.ds-card`           | Definido en CSS    | `1.5rem` (24px) |
| `.ds-card-premium`   | Definido en CSS    | `1.75rem` (28px) |
| `.ds-card-atmospheric` | Definido en CSS  | `1.75rem` (28px) |
| DsCard `padding="sm"` | `p-4`            | `1rem` (16px)   |
| DsCard `padding="lg"` | `p-8`            | `2rem` (32px)   |

### 3.2 Gaps frecuentes

| Contexto               | Clase / valor   | Pixeles |
|------------------------|-----------------|---------|
| KpiGrid                | `gap-4`         | 16px    |
| Page sections          | `space-y-12`    | 48px    |
| Nav items              | `gap-1`         | 4px     |
| Nav item internal      | `gap-2.5`       | 10px    |
| Insight cards          | `gap-3`         | 12px    |
| Sidebar logo padding   | `px-5 py-4`     | 20px / 16px |
| Sidebar nav padding    | `p-3`           | 12px    |
| Workflow canvas nodes   | `gap-4`         | 16px    |

### 3.3 Border radius

| Token / clase       | Valor                           | Pixeles aprox |
|----------------------|---------------------------------|---------------|
| `--radius`           | `0.625rem`                      | 10px          |
| `--radius-sm`        | `calc(0.625rem * 0.6)`          | 6px           |
| `--radius-md`        | `calc(0.625rem * 0.8)`          | 8px           |
| `--radius-lg`        | `0.625rem`                      | 10px          |
| `--radius-xl`        | `calc(0.625rem * 1.4)`          | 14px          |
| `--radius-2xl`       | `calc(0.625rem * 1.8)`          | 18px          |
| Cards (`.ds-card`)   | `0.625rem`                      | 10px          |
| KPI Card             | `rounded-xl`                    | 12px          |
| DataTable            | `rounded-xl`                    | 12px          |
| Nav items            | `rounded-lg`                    | 8px           |
| Client nav items     | `rounded-xl`                    | 12px          |
| Badges               | `rounded-full`                  | 9999px        |
| Avatar (dashboard)   | `rounded-2xl`                   | 16px          |
| Avatar (sidebar)     | `rounded-full`                  | 9999px        |

### 3.4 Sombras del DS

| Token           | Definicion                                                           |
|------------------|----------------------------------------------------------------------|
| `--shadow-ds-sm` | `0 1px 2px rgba(26,30,35,0.03), 0 1px 3px rgba(26,30,35,0.04)`     |
| `--shadow-ds-md` | `0 4px 6px rgba(26,30,35,0.03), 0 2px 4px rgba(26,30,35,0.02)`     |
| `--shadow-ds-lg` | `0 8px 24px rgba(26,30,35,0.04)`                                    |
| `--shadow-ds-xl` | `0 20px 25px rgba(26,30,35,0.06), 0 8px 10px rgba(26,30,35,0.03)`  |
| `.ds-card`       | `0 8px 24px rgba(26,30,35,0.04)` (identico a ds-lg)                |
| Boton primario   | `0 1px 2px rgba(211,154,43,0.28)` → hover: `0 6px 16px rgba(211,154,43,0.32)` |

---

## 4. Catalogo de Componentes

### 4.1 `PageTitle`

**Archivo:** `components/ds/page-title.tsx`

| Prop       | Tipo            | Default | Descripcion                              |
|------------|-----------------|---------|------------------------------------------|
| `eyebrow`  | `string?`       | —       | Label uppercase azul pizarra arriba      |
| `title`    | `string`        | req     | Titulo h1 bold 30px carbon               |
| `subtitle` | `string?`       | —       | Subtitulo 14px azul pizarra, max-w-2xl   |
| `actions`  | `ReactNode?`    | —       | Botones alineados a la derecha           |
| `className`| `string?`       | —       |                                          |

Layout: `flex-col` en mobile, `flex-row items-end` en `sm:`. Margin bottom `mb-8`.

### 4.2 `SectionHeader`

**Archivo:** `components/ds/section-header.tsx`

| Prop       | Tipo            | Default | Descripcion                    |
|------------|-----------------|---------|--------------------------------|
| `title`    | `string`        | req     | h2, 16px semibold, carbon      |
| `hint`     | `string?`       | —       | Texto secundario azul pizarra  |
| `actions`  | `ReactNode?`    | —       | Acciones a la derecha          |

Spacing: `mb-4 mt-12 first:mt-0`.

### 4.3 `DsCard`

**Archivo:** `components/ds/card.tsx`

| Prop       | Tipo                                      | Default      |
|------------|-------------------------------------------|--------------|
| `variant`  | `'standard' \| 'premium' \| 'atmospheric'` | `'standard'` |
| `padding`  | `'sm' \| 'md' \| 'lg'`                    | `'md'`       |

**Variantes CSS:**

- `standard` (`.ds-card`): `bg: #F1EDE3`, `border: 1px solid #E2DED6`, `border-radius: 10px`, `padding: 24px`, `shadow: ds-lg`. Hover: bg `#E2DED6`, border `#C8C4B9`.
- `premium` (`.ds-card-premium`): Base `#F1EDE3` + radial gradient azul marino top-left (12% opacidad) + ambar bottom-right (6% opacidad). Padding 28px.
- `atmospheric` (`.ds-card-atmospheric`): Base `#F1EDE3` + tres radial gradients (indigo bottom-left 8%, ambar center 6%, pizarra right 8%). Padding 28px.

Transicion: `all 220ms ease-out`.

### 4.4 `KpiCard` / `KpiGrid`

**Archivo:** `components/ds/kpi-card.tsx`

**KpiCard props:**

| Prop       | Tipo                                           | Default      |
|------------|------------------------------------------------|--------------|
| `label`    | `string`                                       | req          |
| `value`    | `string \| number`                             | req          |
| `delta`    | `{ text: string; tone?: 'positive' \| 'negative' \| 'neutral' }?` | — |
| `icon`     | `ReactNode?`                                   | —            |
| `tone`     | `'default' \| 'warning' \| 'danger' \| 'success'` | `'default'` |
| `href`     | `string?`                                      | —            |

**Tone accents (barra lateral izquierda + wash):**

| Tone      | Barra gradient                            | Value color |
|-----------|-------------------------------------------|-------------|
| `default` | `#0F2E3D → #1C3F55 → 15% opacidad`       | `#0F2E3D`   |
| `warning` | `#D39A2B → #E8B84A → 15% opacidad`       | `#D39A2B`   |
| `danger`  | `#B42318 → #D04A3E → 15% opacidad`       | `#B42318`   |
| `success` | `#2F6B4F → #3D8A66 → 15% opacidad`       | `#2F6B4F`   |

**Delta colors:** positive `#2F6B4F`, negative `#B42318`, neutral `#355B6F`.

Layout: barra `w-1` izquierda + contenido `p-5`. BG card: `#F1EDE3`. Label: 10px uppercase tracking-[0.1em] azul pizarra. Valor: 40px extrabold. Icon: 32px contenedor con bg `rgba(200,196,185,0.25)`, icon `#8FB6C7`.

**KpiGrid:** `grid grid-cols-2 gap-4 xl:grid-cols-4`.

### 4.5 `StatusBadge`

**Archivo:** `components/ds/status-badge.tsx`

| Prop       | Tipo          | Default  |
|------------|---------------|----------|
| `tone`     | `StatusTone`  | `'muted'`|
| `label`    | `string`      | req      |
| `withDot`  | `boolean`     | `true`   |

**StatusTone values y estilos:**

| Tone       | Background                    | Border                      | Color     |
|------------|-------------------------------|-----------------------------|-----------|
| `active`   | `rgba(28,63,85, 0.08)`       | `rgba(28,63,85, 0.22)`     | `#1C3F55` |
| `progress` | `rgba(15,46,61, 0.08)`       | `rgba(15,46,61, 0.22)`     | `#0F2E3D` |
| `success`  | `rgba(47,107,79, 0.08)`      | `rgba(47,107,79, 0.22)`    | `#2F6B4F` |
| `warning`  | `rgba(211,154,43, 0.08)`     | `rgba(211,154,43, 0.22)`   | `#D39A2B` |
| `error`    | `rgba(180,35,24, 0.08)`      | `rgba(180,35,24, 0.22)`    | `#B42318` |
| `info`     | `rgba(221,234,242, 0.50)`    | `rgba(28,63,85, 0.18)`     | `#1C3F55` |
| `muted`    | `rgba(200,196,185, 0.10)`    | `rgba(200,196,185, 0.22)`  | `#355B6F` |

Dot: `size-1.5 rounded-full` con `background: style.color`.
Layout: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium`.

### 4.6 `EmptyState`

**Archivo:** `components/ds/empty-state.tsx`

| Prop          | Tipo                    | Default   |
|---------------|-------------------------|-----------|
| `icon`        | `ReactNode?`            | —         |
| `title`       | `string`                | req       |
| `description` | `string?`               | —         |
| `action`      | `ReactNode?`            | —         |
| `variant`     | `'card' \| 'inline'`   | `'card'`  |

- `card`: `rounded-xl border border-dashed bg-white py-16 px-6`, border `#E2DED6`.
- `inline`: `py-12` sin envoltorio.
- Icon container: `size-12 rounded-full`, bg `#F1EDE3`, color `#C8C4B9`.
- Title: `text-sm font-semibold`, `#1A1E23`.
- Description: `text-xs`, `#355B6F`, `max-w-sm`.

### 4.7 `DsDataTable`

**Archivo:** `components/ds/data-table.tsx`

Ver seccion 8 (Tablas) para detalle completo.

### 4.8 `DsTimeline`

**Archivo:** `components/ds/timeline.tsx`

Ver seccion detallada abajo.

| Prop           | Tipo              | Default                       |
|----------------|-------------------|-------------------------------|
| `events`       | `TimelineEvent[]` | req                           |
| `loading`      | `boolean`         | `false`                       |
| `emptyMessage` | `string`          | `'Sin actividad registrada.'` |

**TimelineEvent:**

| Campo        | Tipo           | Requerido |
|--------------|----------------|-----------|
| `id`         | `string`       | si        |
| `timestamp`  | `string` (ISO) | si        |
| `title`      | `string`       | si        |
| `description`| `string?`      | no        |
| `actor`      | `string?`      | no        |
| `tone`       | `StatusTone?`  | no        |
| `icon`       | `ReactNode?`   | no        |
| `href`       | `string?`      | no        |
| `category`   | `string?`      | no        |

**Tone colors (timeline dot):**

| Tone       | Color     |
|------------|-----------|
| `active`   | `#1C3F55` |
| `progress` | `#0F2E3D` |
| `success`  | `#2F6B4F` |
| `warning`  | `#D39A2B` |
| `error`    | `#B42318` |
| `info`     | `#1C3F55` |
| `muted`    | `#C8C4B9` |

Dot: `size-3 rounded-full` con centro blanco `size-1`. Linea conectora: `w-px, bg: #E2DED6`. Category pill: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider`, bg `{dotColor}14`, color `{dotColor}`.

Tiempo relativo: "Hace un momento" / "Hace X min" / "Hace X h" / "Hace X dias" / formato `dd MMM yyyy` (es-MX).

### 4.9 `DsNodeCard`

**Archivo:** `components/ds/node-card.tsx`

| Prop       | Tipo            | Default |
|------------|-----------------|---------|
| `type`     | `NodeType`      | req     |
| `title`    | `string`        | req     |
| `subtitle` | `string?`       | —       |
| `meta`     | `string?`       | —       |
| `icon`     | `ReactNode?`    | —       |
| `status`   | `ReactNode?`    | —       |
| `selected` | `boolean`       | `false` |
| `onClick`  | `() => void?`   | —       |

**NodeType config:**

| Type      | Color     | Label    | Glow                                    |
|-----------|-----------|----------|-----------------------------------------|
| `input`   | `#355B6F` | "Input"  | radial-gradient pizarra 6% opacidad     |
| `process` | `#1C3F55` | "Proceso"| radial-gradient indigo 6% opacidad      |
| `output`  | `#D39A2B` | "Output" | radial-gradient ambar 6% opacidad       |

Base: `bg-white`, `min-w-[200px]`, `rounded-xl border`. Selected: border = type color, box-shadow con type color. Icon container: `size-7 rounded-md text-white` con bg = type color.

### 4.10 `DsWorkflowCanvas`

**Archivo:** `components/ds/workflow-canvas.tsx`

| Prop          | Tipo                           | Default        |
|---------------|--------------------------------|----------------|
| `variant`     | `'horizontal' \| 'vertical'`  | `'horizontal'` |
| `children`    | `ReactNode`                    | req            |
| `title`       | `string?`                      | —              |
| `description` | `string?`                      | —              |

Container: `rounded-2xl border bg-white p-6`, border `#E2DED6`. Conector entre nodos: `ChevronRight` icon, `size-5`, color `#C8C4B9`. En vertical se rota 90deg.

### 4.11 `CsvToolbar`

**Archivo:** `components/ds/csv-toolbar.tsx`

| Prop               | Tipo           | Default        |
|--------------------|----------------|----------------|
| `endpoint`         | `string`       | req            |
| `templateColumns`  | `string[]`     | req            |
| `templateExample`  | `string[]?`    | —              |
| `entityLabel`      | `string`       | `'registros'`  |
| `onImportSuccess`  | `() => void?`  | —              |

Container: `rounded-xl px-4 py-2.5`, bg `#F1EDE3`. Botones: `rounded-lg px-2.5 py-1.5 text-xs font-medium`, color `#0F2E3D`. Hover: bg `rgba(226,222,214,0.6)`. Separadores: `h-4 w-px`, bg `#E2DED6`.

Result badge success: bg `rgba(47,107,79,0.08)`, color `#2F6B4F`. Error: bg `rgba(180,35,24,0.06)`, color `#B42318`.

---

## 5. Sistema de Status

### 5.1 StatusTone (enum del DS)

Los 7 tones son: `active`, `progress`, `success`, `warning`, `error`, `info`, `muted`.

### 5.2 Labels por entidad (ES-MX)

**Tenant:**
`ACTIVE` → Activo, `SUSPENDED` → Suspendido, `ONBOARDING` → Onboarding

**Brand (legal_status):**
`APPLIED` → Solicitada, `REGISTERED` → Registrada, `RENEWED` → Renovada, `EXPIRED` → Expirada, `ABANDONED` → Abandonada, `CANCELLED` → Cancelada, `OPPOSED` → Impugnada

**Brand type:**
`WORDMARK` → Nominativa, `FIGURATIVE` → Figurativa, `MIXED` → Mixta, `THREE_D` → Tridimensional, `SOUND` → Sonora, `HOLOGRAPHIC` → Holografica, `OLFACTORY` → Olfativa

**Contract status:**
`DRAFT` → Borrador, `ACTIVE` → Vigente, `EXPIRED` → Vencido, `TERMINATED` → Terminado, `RENEWED` → Renovado, `UNDER_REVIEW` → En revision

**Contract type:**
`LICENSE_INTERNAL` → Licencia interna, `LICENSE_EXTERNAL` → Licencia externa, `COEXISTENCE` → Coexistencia, `ASSIGNMENT` → Cesion, `FRANCHISE` → Franquicia, `DISTRIBUTION` → Distribucion, `SETTLEMENT` → Transaccion, `NDA` → Confidencialidad

**License status:**
`DRAFT` → Borrador, `ACTIVE` → Vigente, `EXPIRED` → Vencida, `TERMINATED` → Terminada, `SUSPENDED` → Suspendida

**License type:**
`EXCLUSIVE` → Licencia exclusiva, `NON_EXCLUSIVE` → No exclusiva, `SUBLICENSE` → Sublicencia

**Holding:**
`ACTIVE` → Activo, `INACTIVE` → Inactivo, `DISSOLVED` → Disuelto

**Company:**
`ACTIVE` → Activa, `INACTIVE` → Inactiva, `MERGED` → Fusionada, `DISSOLVED` → Disuelta

**Holder:**
`ACTIVE` → Activo, `INACTIVE` → Inactivo

**Brand class:**
`ACTIVE` → Activa, `PENDING` → Pendiente, `CANCELLED` → Cancelada

### 5.3 Colores de status por legal_status (dashboard chart)

| Status        | Hex       | Nombre palette        |
|---------------|-----------|------------------------|
| APPLIED       | `#8FB6C7` | Azul Niebla            |
| PUBLISHED     | `#355B6F` | Azul Pizarra           |
| REGISTERED    | `#0F2E3D` | Azul Marino Profundo   |
| RENEWED       | `#1C3F55` | Indigo Estrategico     |
| EXPIRED       | `#B42318` | Estado Critico         |
| CANCELLED     | `#C8C4B9` | Gris Piedra Calido     |
| OPPOSED       | `#D39A2B` | Ambar Sutil            |
| IN_LITIGATION | `#0B1F2A` | Azul Noche             |

### 5.4 Mapeo action → tone (timeline)

| Action                              | Tone      |
|--------------------------------------|-----------|
| CREATED, REGISTRATION, RENEWED, RENEWAL | `success` |
| EXPIRED, TERMINATED, CANCELLATION    | `error`   |
| UPDATED, MODIFICATION, STATUS_CHANGE | `active`  |
| LITIGATION_START, OPPOSITION         | `warning` |
| Otros                                | `muted`   |

---

## 6. Sistema de Vigencia

### 6.1 `VigencyBadge` (components/vigency-badge.tsx)

Badge con dot y texto. Logica basada en `expirationDate` y `legalStatus`.

**Override por legalStatus:**

| Status                               | Dot class       | Label       |
|---------------------------------------|-----------------|-------------|
| CANCELLED                            | `bg-slate-400`  | "Cancelado" |
| OPPOSED                              | `bg-slate-400`  | "Opuesta"   |
| APPLIED, PUBLISHED                   | `bg-slate-400`  | "Pendiente" |

**Buckets por dias restantes (si no hay override):**

| Condicion           | Dot color        | Badge bg/text               | Label                   |
|---------------------|------------------|-----------------------------|-------------------------|
| `diffDays < 0`      | `bg-red-500`     | `bg-red-50 text-red-700`    | "Vencido"              |
| `diffDays <= 30`    | `bg-orange-500`  | `bg-orange-50 text-orange-700` | "Vence en X dias"   |
| `diffDays <= 90`    | `bg-yellow-500`  | `bg-yellow-50 text-yellow-700` | "Vence en X dias"   |
| `diffDays > 90`     | `bg-green-500`   | `bg-green-50 text-green-700`   | "Vigente"            |
| Sin fecha           | `bg-slate-400`   | `bg-slate-100 text-slate-600`  | "Sin fecha"          |

Layout: `rounded-full px-2.5 py-0.5 text-xs font-medium`, dot `h-1.5 w-1.5 rounded-full`, gap `gap-1.5`.

### 6.2 `BrandVigencyDot` (components/brand-vigency-dot.tsx)

Dot solo (sin badge). Usa colores hex directos del DS.

**Override por legalStatus:**

| Status              | Color     |
|---------------------|-----------|
| CANCELLED           | `#C8C4B9` |
| APPLIED, PUBLISHED  | `#C8C4B9` |
| EXPIRED             | `#B42318` |

**Buckets por dias:**

| Condicion           | Color     |
|---------------------|-----------|
| `diffDays < 0`      | `#B42318` |
| `diffDays <= 90`    | `#D39A2B` |
| `diffDays > 90`     | `#2F6B4F` |
| Sin fecha           | `#C8C4B9` |

Dot: `size-2.5 rounded-full`. Incluye `title` con texto descriptivo para tooltip nativo.

### 6.3 Diferencias entre los dos componentes

`VigencyBadge` usa clases Tailwind (bg-red-500, etc.) y tiene bucket 30-90 dias separados. `BrandVigencyDot` usa hex del DS directamente y combina 0-90 en un solo bucket ambar. Ambos respetan los mismos override de legalStatus.

---

## 7. Cards y Containers

### 7.1 Variantes de DsCard (resumen visual)

| Variante       | Background                                     | Border          | Radius | Padding |
|----------------|-------------------------------------------------|-----------------|--------|---------|
| `standard`     | `#F1EDE3` flat                                  | `1px #E2DED6`   | 10px   | 24px    |
| `premium`      | `#F1EDE3` + radial navy top-left + ambar bottom-right | `1px #E2DED6` | 10px | 28px |
| `atmospheric`  | `#F1EDE3` + 3 radial gradients (indigo, ambar, pizarra) | `1px #E2DED6` | 10px | 28px |

### 7.2 Containers especializados

| Componente           | BG            | Border                | Radius      |
|----------------------|---------------|-----------------------|-------------|
| DataTable wrapper    | `#F1EDE3`     | `1px #E2DED6`         | `rounded-xl` |
| EmptyState card      | `white`       | `1px dashed #E2DED6`  | `rounded-xl` |
| WorkflowCanvas       | `white`       | `1px #E2DED6`         | `rounded-2xl` |
| CsvToolbar           | `#F1EDE3`     | ninguno               | `rounded-xl` |
| Insight cards        | `#FBF6EC`     | `1px #E2DED6`         | `rounded-xl` |
| Tooltip (sidebar)    | `#0F2E3D`     | ninguno               | `rounded-lg` |

---

## 8. Tablas (DsDataTable)

### 8.1 Props principales

| Prop         | Tipo                  | Descripcion                          |
|--------------|------------------------|--------------------------------------|
| `columns`    | `DsColumn<T>[]`       | Definicion de columnas               |
| `rows`       | `T[]`                 | Datos                                |
| `getRowId`   | `(row: T) => string`  | Extractor de key unica               |
| `loading`    | `boolean`             | Muestra skeleton                     |
| `empty`      | `{title, description?, icon?, action?}` | Empty state config |
| `rowActions`  | `DsRowAction<T>[]`   | Menu de acciones por fila            |
| `onRowClick` | `(row: T) => void`    | Click en fila                        |

### 8.2 DsColumn interface

| Campo           | Tipo                      | Descripcion               |
|-----------------|----------------------------|---------------------------|
| `key`           | `string`                   | ID de la columna          |
| `header`        | `string`                   | Texto del header          |
| `width`         | `string \| number?`        | Ancho explicito           |
| `sortable`      | `boolean?`                 | Habilita sort client-side |
| `cell`          | `(row: T) => ReactNode?`  | Render custom             |
| `headerTooltip` | `string?`                  | Tooltip en el header      |
| `align`         | `'left' \| 'right' \| 'center'?` | Alineacion       |

### 8.3 DsRowAction interface

| Campo         | Tipo                       | Descripcion                     |
|---------------|-----------------------------|---------------------------------|
| `label`       | `string`                    | Texto de la accion              |
| `onClick`     | `(row: T) => void?`        | Handler click                   |
| `href`        | `(row: T) => string?`      | Navegar en lugar de onClick     |
| `destructive` | `boolean?`                  | Estilo destructivo              |
| `icon`        | `ReactNode?`               | Icono Lucide                    |
| `quickAction` | `boolean?`                  | Inline icon vs overflow menu    |

### 8.4 Estilos de la tabla

- **Header:** bg `rgba(255,255,255,0.5)`, text `#355B6F`, `text-[11px] font-semibold uppercase tracking-[0.08em]`.
- **Header sortable hover:** color cambia a `#1A1E23`.
- **Sort icons:** color `#C8C4B9`, size `size-3`. Usa ArrowUp/ArrowDown/ArrowUpDown de Lucide.
- **Celdas:** `px-4 py-3 text-sm`, color `#1A1E23`.
- **Row hover (si onRowClick):** bg `rgba(255,255,255,0.6)`.
- **Row dividers:** `divide-y`, color `rgba(226,222,214,0.5)`.
- **Quick action button:** `size-7 rounded-md`, default color `#C8C4B9`, hover `#1A1E23` con bg `#E2DED6`. Destructive hover: `#B42318` con bg `rgba(180,35,24,0.06)`.
- **Quick action tooltip:** `rounded-md px-2 py-1 text-[11px]`, bg `#0B1F2A`, color `#FBF6EC`.
- **Overflow menu:** trigger `MoreVertical size-4`, dropdown `w-44`.
- **Loading skeleton:** 5 filas, `h-12 animate-pulse rounded-lg`, bg `rgba(255,255,255,0.6)`.

---

## 9. Navegacion

### 9.1 Promark Sidebar (oscuro/premium)

**Archivo:** `components/promark-sidebar.tsx`

**Estructura:**
```
aside (w-64, sticky top-0, h-screen)
  ├── Logo header (border-bottom, bg claro 6%)
  │     ├── Icono promark-icon.svg (h-9 w-9)
  │     ├── "Promark®" (16px bold, #FBF6EC)
  │     └── "Inteligencia marcaria" (10px uppercase, 58% opacidad)
  ├── Nav (flex-1, overflow-y-auto, p-3)
  │     ├── Section label "Workspace" (10px uppercase, 45% opacidad)
  │     ├── Panel (LayoutDashboard)
  │     ├── Clientes (Building2)
  │     └── [Si tenant seleccionado] Section label "{tenantName}"
  │           ├── Vista general, Estructura, Portafolio, Alertas
  │           ├── Financiero, Actividad, Configuracion
  │           └── Badge count en Alertas si > 0
  └── User footer (border-top)
        ├── Avatar + nombre + role + Settings icon
        └── Cerrar sesion (LogOut)
```

**Background:** `linear-gradient(135deg, #0B1F2A 0%, #0F2E3D 100%)`, border-right `rgba(251,246,236, 0.12)`.

**Nav item activo:**
- bg: `rgba(251,246,236, 0.10)`
- color: `#FBF6EC`
- border-left: `3px solid #D39A2B`
- padding-left: `9px` (compensa el border)
- Icon color: `#D39A2B`

**Nav item inactivo:**
- color: `rgba(251,246,236, 0.72)`
- Icon color: `rgba(251,246,236, 0.50)`

**Nav item hover (inactivo):**
- bg: `rgba(251,246,236, 0.08)`
- color: `#FBF6EC`

**Alert badge:** `rounded-full px-1.5 py-0.5 text-[10px] font-semibold`, bg `#B42318`, color `#FBF6EC`.

**User card:** border `rgba(251,246,236, 0.10)`, bg `rgba(251,246,236, 0.04)`. Hover: bg `0.08`, border `rgba(211,154,43, 0.30)`. Avatar sin imagen: bg `rgba(211,154,43, 0.2)`, text `#D39A2B`.

**Logout hover:** bg `rgba(180,35,24, 0.15)`, color `#F9E8E5`.

### 9.2 Client Sidebar (claro/branded)

**Archivo:** `app/brand-ecosystem/[tenant-slug]/client-sidebar.tsx`

**Diferencias clave vs Promark sidebar:**

| Aspecto         | Promark                          | Client                          |
|-----------------|----------------------------------|---------------------------------|
| Background      | Gradient azul oscuro             | `#F1EDE3` (hueso)              |
| Border          | rgba marfil 12%                  | `#E2DED6` solido               |
| Active accent   | `#D39A2B` (ambar fijo)           | `var(--tenant-primary)` (dinamico) |
| Active bg       | marfil 10%                       | `{primaryColor}15`             |
| Active indicator| border-left 3px                  | `box-shadow: inset 3px 0 0`   |
| Nav items       | rounded-lg                       | rounded-xl                     |
| Text inactivo   | marfil 72%                       | `#355B6F`                      |
| Text hover      | marfil 100%                      | `#0F2E3D`                      |
| Hover bg        | marfil 8%                        | `rgba(226,222,214,0.5)`       |
| Logo fallback   | Gradient marino-indigo           | Gradient del primaryColor      |
| Subtitulo       | "Inteligencia marcaria"          | "Portal de clientes"           |
| Subtitulo color | marfil 58%                       | `#8FB6C7`                      |
| Tooltips        | No tiene                         | Si, bg `#0F2E3D`, arrow CSS   |

**Nav items del client portal:**
1. Panel (LayoutDashboard)
2. Marcas (Tag)
3. Alertas (Bell) — condicional `showAlerts`
4. Documentos (FileText)
5. Contratos (ScrollText) — condicional `showContracts`

**Logout (client):** Solo icono en el footer, hover bg `rgba(180,35,24,0.08)`, color `#B42318`.

### 9.3 Iconos (Lucide)

Todos los iconos del sidebar vienen de `lucide-react`. Tamano standard: `h-4 w-4` / `size-4`.

Iconos usados: LayoutDashboard, Building2, Network, Bell, Activity, Settings, UserCircle, LogOut, Briefcase, DollarSign, Tag, FileText, ScrollText.

---

## 10. Estados Interactivos

### 10.1 Hover patterns

| Elemento                 | Propiedad            | Normal                      | Hover                           | Transicion         |
|--------------------------|----------------------|-----------------------------|---------------------------------|--------------------|
| `.ds-card`               | background           | `#F1EDE3`                   | `#E2DED6`                       | `220ms ease-out`   |
| `.ds-card`               | border-color         | `#E2DED6`                   | `#C8C4B9`                       | `220ms ease-out`   |
| `.ds-btn-primary`        | filter               | none                        | `brightness(0.96)`              | `220ms ease-out`   |
| `.ds-btn-primary`        | box-shadow           | `rgba(211,154,43,0.28)`     | `rgba(211,154,43,0.32)` + 6px  | `220ms ease-out`   |
| `.ds-btn-primary`        | transform            | none                        | `translateY(-1px)`              | `220ms ease-out`   |
| DataTable row            | background           | transparent                 | `rgba(255,255,255,0.6)`        | via class          |
| DataTable header sortable| color                | `#355B6F`                   | `#1A1E23`                       | inline style       |
| Quick action button      | color/bg             | `#C8C4B9` / none            | `#1A1E23` / `#E2DED6`          | via class          |
| Nav item (Promark)       | bg/color             | transparent / marfil 72%    | marfil 8% / marfil 100%        | `200ms` duration   |
| Nav item (Client)        | bg/color             | transparent / `#355B6F`     | `rgba(226,222,214,0.5)` / `#0F2E3D` | via class    |
| CsvToolbar button        | background           | transparent                 | `rgba(226,222,214,0.6)`        | via class          |
| Timeline event (link)    | opacity              | 1                           | 0.8                             | `transition-opacity`|

### 10.2 Focus patterns

Focus ring global: `outline-ring/50` (usa `--ring` = `#D39A2B` ambar).

### 10.3 Transiciones

Duracion default: `220ms ease-out` para cards y botones. `200ms` para nav items. `transition-all` en la mayoria de componentes interactivos.

---

## 11. Animaciones

### 11.1 Ping dot ("Sistema activo")

```html
<span class="relative flex h-3 w-3">
  <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
        style="background: #2F6B4F" />
  <span class="relative inline-flex h-3 w-3 rounded-full"
        style="background: #2F6B4F" />
</span>
```

`animate-ping` es Tailwind built-in (scale + fade out loop).

### 11.2 Loading skeletons

- DataTable: 5 filas `h-12 animate-pulse rounded-lg`, bg `rgba(255,255,255,0.6)`.
- Timeline: 3 filas con dot `size-2 bg-#C8C4B9` + `h-10 animate-pulse rounded-lg bg-#F1EDE3`.

### 11.3 Spinner (CsvToolbar import)

`Loader2` de Lucide con `animate-spin`, `size-3.5`.

### 11.4 Transicion de cards

`transition: all 220ms ease-out` en `.ds-card`, `.ds-btn-primary`.

---

## 12. Charts (Recharts)

### 12.1 Config global compartida

**Tooltip style (todos los charts):**
```css
background-color: #0B1F2A;
border: none;
border-radius: 10px;
padding: 8px 14px;
box-shadow: 0 8px 32px rgba(0,0,0,0.18);
color: #FBF6EC (o #F1F5F9 en vigency/impi);
font-size: 12px;
font-family: var(--font-dm-sans, DM Sans, sans-serif);
```

Item style: color `#DDEAF2` (o `#E2E8F0`), fontSize 12.

**Axes comunes:**
- tickLine: `false`
- axisLine: `false`
- X tick: `fontSize: 10, fill: #C8C4B9`
- Y tick: `fontSize: 11, fill: #355B6F, fontWeight: 500`

**Animacion:** `isAnimationActive={false}` en todos los charts.

### 12.2 StatusDonut

- Tipo: `PieChart` con `Pie` donut (innerRadius 68, outerRadius 100)
- paddingAngle: 2, cornerRadius: 4
- Cada cell usa `linearGradient` del color al 75% opacidad
- Filter shadow: `feDropShadow dx=0 dy=2 stdDeviation=4 floodOpacity=0.08`
- Centro: total en `text-4xl font-bold`, label "Marcas analizadas" en `text-xs`
- Layout: grid 1-col mobile, 2-col md (donut + tabla resumen)
- Tabla resumen: bg `#FBF6EC`, border `#E2DED6`
- 3 insight cards debajo: Insight principal, Riesgo legal, Accion sugerida

### 12.3 TopTenantsBar

- Tipo: `BarChart` horizontal (`layout="vertical"`)
- Gradient: `#0F2E3D → #1C3F55` horizontal
- radius: `[0, 6, 6, 0]`, barSize: 28
- YAxis width: 120
- Cursor hover: `fill: rgba(226,222,214,0.3)`, radius 6
- Titulo: `text-xs font-semibold uppercase tracking-wider`, color `#355B6F`

### 12.4 VigencyTimeline

- Tipo: `BarChart` vertical
- Gradient: `#1C3F55` vertical (100% → 50% opacidad)
- radius: `[6, 6, 0, 0]`, barSize: 18
- ReferenceLine: `stroke: #E2E8F0, strokeDasharray: 4 4`
- XAxis interval: 2, meses en ES corto ("Ene", "Feb", etc.)

### 12.5 ImpiClassBar

- Tipo: `BarChart` horizontal (`layout="vertical"`)
- Gradient: `#0F2E3D (80%) → #355B6F (100%)` horizontal
- radius: `[0, 6, 6, 0]`, barSize: 24
- YAxis width: 80, labels "Clase X"

### 12.6 Empty states de charts

Todos usan `flex h-full items-center justify-center text-sm`, color `#C8C4B9`.

---

## 13. Forms e Inputs

### 13.1 Tokens de input

| Token           | Valor       |
|-----------------|-------------|
| `--ds-bg-input` | `#FFFFFF`   |
| `--input`       | `#E2DED6`   |
| `--ring`        | `#D39A2B`   |

Los inputs usan shadcn/ui primitives (`@/components/ui/input`) con los tokens de arriba.

### 13.2 CsvToolbar como patron de toolbar

Container `rounded-xl px-4 py-2.5 bg-#F1EDE3`. Botones ghost con hover `rgba(226,222,214,0.6)`. Separadores verticales `h-4 w-px bg-#E2DED6`. File input hidden con trigger via ref.

### 13.3 Search patterns

No hay un componente de search dedicado en el DS. Las busquedas se implementan con shadcn Input + icono Search de Lucide.

---

## 14. Responsive

### 14.1 Breakpoints (Tailwind default)

| Breakpoint | Valor   |
|------------|---------|
| `sm`       | 640px   |
| `md`       | 768px   |
| `lg`       | 1024px  |
| `xl`       | 1280px  |
| `2xl`      | 1536px  |

### 14.2 Patrones responsive usados

| Componente     | Mobile             | Desktop              |
|----------------|--------------------|----------------------|
| KpiGrid        | `grid-cols-2`      | `xl:grid-cols-4`     |
| PageTitle      | `flex-col`         | `sm:flex-row items-end` |
| StatusDonut    | `grid-cols-1`      | `md:grid-cols-2`     |
| Insight cards  | `grid-cols-1`      | `sm:grid-cols-3`     |
| Sidebar        | `w-64` fijo        | No colapsa (no hay hamburger) |
| DataTable      | `overflow-x-auto`  | Scroll horizontal    |

---

## 15. Tenant Branding

### 15.1 Variable `primaryColor`

El client sidebar recibe `primaryColor: string` como prop (hex). Se usa para:

- **Active nav item bg:** `{primaryColor}15` (15 = hex para ~8% opacidad)
- **Active nav item text:** `{primaryColor}` directo
- **Active nav item shadow:** `inset 3px 0 0 {primaryColor}`
- **Logo fallback gradient:** `linear-gradient(135deg, {primaryColor}, {primaryColor}cc)`

No se usa CSS custom property `--tenant-primary` inyectada en :root. El color se pasa como prop inline desde el servidor.

### 15.2 Cascada

El layout del brand-ecosystem lee el tenant de la BD (campo `primary_color`) y lo inyecta al `ClientSidebar`. No hay cascada CSS — es prop drilling.

---

## 16. Brand Logos

### 16.1 Avatar extraction pattern

Funcion `extractAvatarSrc(avatar: unknown)` usada en sidebar y dashboard:

```
1. Si es string que empieza con "data:" → usar directo
2. Si es Array → tomar primer elemento (.url o .data)
3. Si es Object → tomar .url, .data, o .image
4. Else → null (mostrar fallback initials)
```

### 16.2 Fallback initials

- **Dashboard avatar:** `h-16 w-16 rounded-2xl`, gradient `#0F2E3D → #1C3F55`, text `#FBF6EC`, border `3px solid #E2DED6`.
- **Sidebar avatar (Promark):** `h-8 w-8 rounded-full`, bg `rgba(211,154,43,0.2)`, text `#D39A2B`. Si tiene imagen: border `2px solid rgba(211,154,43,0.4)`.
- **Client sidebar avatar:** `h-8 w-8 rounded-full`, gradient `#0F2E3D → #1C3F55`, text `#FBF6EC`.
- **Client sidebar logo:** `h-9 w-9 rounded-lg object-contain`. Fallback: primer caracter, gradient con `primaryColor`.

### 16.3 Status dot del avatar (dashboard)

Circulo verde `#2F6B4F` en esquina inferior-derecha del avatar, con anillo blanco `#FBF6EC` de 2px.

---

## 17. Patrones de Pagina

### 17.1 PageTitle con eyebrow

```
eyebrow: "Panel ejecutivo" (11px, uppercase, #355B6F, tracking 0.08em)
title: "Bienvenido, {nombre}" (30px, bold, #1A1E23, tracking-tight)
subtitle: "Vista general de todos los clientes" (14px, #355B6F)
```

### 17.2 KpiGrid

Siempre despues del PageTitle, con `space-y-12` de separacion. 4 cards en desktop, 2 en mobile. Cada card con label descriptivo, valor numerico grande, icono, y tone opcional.

### 17.3 Empty states

Cuando no hay datos: `EmptyState` con icono, titulo, descripcion y boton CTA (`ds-btn-primary`). Ejemplo: "Sin datos disponibles aun" con link a crear primer cliente.

### 17.4 Patron de pagina completa (dashboard)

```
div.space-y-12
  ├── Header row (avatar + PageTitle + status badge "Sistema activo")
  ├── KpiGrid (4 cards)
  ├── DsCard > StatusDonut
  ├── DsCard > TopTenantsBar
  └── RecentActivity (SectionHeader + DsTimeline)
```

### 17.5 Status badge "Sistema activo"

Container: `rounded-xl border px-4 py-2.5`, border `#E2DED6`, bg `#F1EDE3`. Contiene ping dot verde + texto "Sistema activo" en `text-xs font-semibold color-#2F6B4F`.

### 17.6 Seccion RecentActivity

Usa `SectionHeader` + `DsTimeline`. Items se mapean de `ActivityItem` → `TimelineEvent` con:
- `category`: tipo de entidad (Marca, Contrato, etc.)
- `tone`: segun accion (success/error/active/warning/muted)
- `title`: "{Accion}: {nombre_entidad}"
- `actor`: nombre del usuario
- `href`: link al detalle

---

*Guia generada a partir del codigo fuente de Promark® Platform.*
