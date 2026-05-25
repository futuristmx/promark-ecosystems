# Promark® Design System

Capa propia del producto sobre shadcn/ui. Vive en `components/ds/` y se importa así:

```tsx
import { PageTitle, KpiCard, KpiGrid, DsCard, StatusBadge, EmptyState } from '@/components/ds';
```

---

## Paleta canónica (light v2)

Tokens en `app/globals.css` como CSS variables. Mapean a shadcn tokens y se exponen al theme.

| Token | Hex | Uso |
|---|---|---|
| `--ds-text-header` | `#0A0E15` | Títulos H1-H3, valores KPI |
| `--ds-text-body` | `#1A2030` | Cuerpo, párrafos |
| `--ds-text-muted` | `#4E576A` | Subtítulos, helpers |
| `--ds-text-soft` | `#8892A0` | Captions, metadatos |
| `--ds-bg-app` | `#FAFBFC` | Background app |
| `--ds-bg-sidebar` | `#FFFFFF` | Sidebar bg |
| `--ds-bg-panel` | `#FFFFFF` | Sub-panels, popovers |
| `--ds-bg-card` | `#EDEFF3` | **Card bg (gris azulado claro)** |
| `--ds-bg-card-soft` | `#E4E8EE` | Card hover, sub-secciones |
| `--ds-bg-input` | `#FFFFFF` | Inputs |
| `--ds-accent-blue` | `#2C3445` | **Navy estructural** — labels, borders |
| `--ds-accent-electric` | `#0066FF` | **Electric blue** — CTAs, focus, active |
| `--ds-accent-cyan` | `#0284C7` | Acentos secundarios |
| `--ds-accent-pink` | `#DB2777` | Atmospheric, decorativos |
| `--ds-accent-orange` | `#EA580C` | Warning |
| `--ds-status-active` | `#0066FF` | Estado activo (badge) |
| `--ds-status-progress` | `#2C3445` | En proceso |
| `--ds-status-success` | `#16A34A` | Éxito |
| `--ds-status-warning` | `#EA580C` | Advertencia |
| `--ds-status-error` | `#DC2626` | Error / expirado |

### Shadcn tokens mapeados

Cualquier componente shadcn (`<Button>`, `<Card>`, etc) automáticamente usa estos:

| Shadcn token | Mapea a |
|---|---|
| `--primary` | `#0066FF` (electric) |
| `--background` | `#FAFBFC` |
| `--card` | `#EDEFF3` |
| `--secondary` | `#E4E8EE` |
| `--ring` | `#0066FF` |
| `--destructive` | `#DC2626` |

---

## Componentes ds/

### `<PageTitle>`

Header de página estándar. Eyebrow (uppercase electric) → title → subtitle + acciones.

```tsx
<PageTitle
  eyebrow="Panel ejecutivo"
  title="Inteligencia marcaria"
  subtitle="2 clientes activos · 13 marcas · 3 contratos"
  actions={
    <>
      <Button variant="outline">Buscar</Button>
      <Button>+ Nuevo cliente</Button>
    </>
  }
/>
```

### `<SectionHeader>`

Separa bloques dentro de una página. Title + hint opcional + acciones.

```tsx
<SectionHeader
  title="Marcas en riesgo"
  hint="Vencen en los próximos 90 días"
  actions={<Button variant="outline" size="sm">Ver todas</Button>}
/>
```

### `<DsCard>`

Card base con 3 variantes.

```tsx
<DsCard variant="standard">Contenido normal</DsCard>
<DsCard variant="premium">CTA importante, insight clave</DsCard>
<DsCard variant="atmospheric">Bloque AI / sugerencias del agente</DsCard>
```

**Cuándo usar cada una:**
- `standard` — listas, métricas simples, contenido secundario
- `premium` — bloques destacados con gradient navy + electric (jerarquía visual)
- `atmospheric` — módulos AI o promocionales con gradients pink/orange/electric

### `<KpiCard>` + `<KpiGrid>`

Para dashboards.

```tsx
<KpiGrid>
  <KpiCard label="Total marcas" value={13} delta={{ text: "+2 este mes", tone: "positive" }} />
  <KpiCard label="Por vencer (90d)" value={2} tone="warning" />
  <KpiCard label="Vencidas" value={1} tone="danger" />
  <KpiCard label="Contratos" value={3} icon={<Scroll className="size-4" />} />
</KpiGrid>
```

`<KpiGrid>` es responsive: 2 cols mobile, 3 tablet, 5 2xl screens (resuelve F11 del audit).

### `<StatusBadge>`

Badge semántico con dot opcional.

```tsx
<StatusBadge tone="success" label="Renovada" />
<StatusBadge tone="warning" label="Por vencer" />
<StatusBadge tone="error" label="Expirada" />
<StatusBadge tone="active" label="Activa" withDot={false} />
```

**Tones disponibles:** `active` `progress` `success` `warning` `error` `info` `muted`

### `<EmptyState>`

Estado vacío reusable. Reemplaza ~5 implementaciones dispersas.

```tsx
<EmptyState
  icon={<FileText className="size-6" />}
  title="Sin documentos"
  description="Aún no hay documentos cargados para esta marca."
  action={<Button>Subir documento</Button>}
/>

// Para usar dentro de un card existente, sin envoltorio:
<EmptyState variant="inline" title="Sin resultados" />
```

---

## Tipografía

`DM Sans` primaria, `Open Sans` y `Manrope` como fallbacks. Cargadas vía `next/font/google` (self-hosted).

| Tamaño | Class Tailwind | Uso |
|---|---|---|
| 56px | `text-6xl` | Hero / display |
| 40px | `text-5xl` | Section hero |
| 28px | `text-3xl` | H1 página |
| 20px | `text-xl` | H2 sección, card titles |
| 16px | `text-base` | Body |
| 14px | `text-sm` | Subtítulos, secondary |
| 12px | `text-xs` | Captions, metadatos |
| 11px | uppercase tracking-[0.08em] | Labels, eyebrows |

Headings tienen `letter-spacing: -0.02em` (tight tracking) automáticamente via `globals.css`.

---

## Component classes (`@layer components`)

Para usar directamente como className cuando no se quiere importar un componente React:

```html
<div class="ds-card">…</div>
<div class="ds-card-premium">…</div>
<div class="ds-card-atmospheric">…</div>
<button class="ds-btn-primary">…</button>
<span class="ds-label-uc">workspace</span>
```

---

## Reglas de uso

1. **No hardcodees hex.** Si necesitas un color de la paleta, usa CSS var (`var(--ds-accent-electric)`) o class (`text-[#0066FF]` solo si no hay alternativa).
2. **Usa `<PageTitle>` y `<SectionHeader>` en TODAS las páginas Promark side.** Consistencia editorial.
3. **Prefiere `<DsCard>` sobre `<Card>` para nuevos componentes.** El primero usa `--ds-bg-card`, el segundo usa `--card` (que también mapea pero menos explícito).
4. **`<KpiGrid>` por encima de grid manual.** Resuelve el bug de truncamiento.
5. **Status semántico siempre via `<StatusBadge>`.** No uses `<Badge>` para estados; ese es genérico.

---

## Roadmap

Pendientes para futuras olas:

- [ ] `<PromptBox>` para inputs AI
- [ ] `<DataTable>` premium (sobre `<Table>` shadcn)
- [ ] `<Timeline>` para historiales
- [ ] `<NodeCard>` para canvas / workflows
- [ ] Dark mode toggle (paleta dark ya en `globals.css` bajo `.dark`)
- [ ] Storybook con todos los componentes
- [ ] Visual regression tests
