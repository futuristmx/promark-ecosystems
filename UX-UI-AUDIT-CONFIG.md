# UX/UI Intelligence — Página de Configuración de Cliente

**Fecha:** 2026-05-26
**Auditor:** Claude (Design Systems Engineer)
**Scope:** `/tenants/[id]/configuracion`

---

## ✅ Lo que se implementó

### Arquitectura de pestañas
- **4 tabs**: Branding, Portal & URL, Credenciales, Notificaciones
- Tab bar con gradiente marino en tab activo, hover sutil en inactivos
- Enlace directo al portal del cliente desde la tab bar

### Branding (Tab 1)
- Editor de nombre, color primario con chips de opacidad, logo con drag-drop zone
- Preview en vivo del portal (sticky, columna derecha)
- Upload mejorado: zona punteada con hover ámbar, preview del logo cargado con opciones cambiar/quitar

### Portal & URL (Tab 2) — NUEVO
- Editor de slug con preview de URL completa en tiempo real
- Validación inline (regex, longitud mínima, unicidad vía API)
- Warning card con icono cuando el slug cambia (impacto en enlaces existentes)

### Credenciales (Tab 3) — NUEVO
- Lista de usuarios del portal con avatar, rol, estado, card_id
- Selección visual con ring ámbar
- Reseteo de PIN por usuario específico (no solo el admin)
- Indicador de último cambio de PIN
- Panel informativo sobre roles y sistema de autenticación

### Notificaciones (Tab 4)
- Email destinatario y días de anticipación separados en cards propias
- Panel explicativo de cómo funcionan las alertas

---

## 🔮 Recomendaciones para nivel premium (próximas iteraciones)

### P1 — Alta prioridad

1. **Historial de versiones visible**
   - Cada cambio ya crea un `TenantVersion`. Mostrar timeline de versiones con diff visual.
   - Botón "Restaurar versión anterior" para rollback.
   - Impacto: confianza del superadmin, auditoría visual.

2. **Feature flags con toggles**
   - La tabla `active_modules` ya existe. Agregar tab "Módulos" con switches premium para:
     `show_brand_history`, `show_contracts`, `show_graph_view`, `show_documents`, `allow_document_download`.
   - UI: toggle switches con etiqueta y descripción, agrupados por categoría.

3. **Gestión completa de usuarios**
   - CRUD de `UserClient` desde la configuración (crear, editar nombre/email/card_id, activar/desactivar).
   - Actualmente solo se puede resetear PIN. Falta: crear usuario, cambiar rol, bloquear/desbloquear.

### P2 — Media prioridad

4. **Logo con crop/resize integrado**
   - Componente de crop circular/cuadrado antes de guardar el logo.
   - Preview en múltiples tamaños (sidebar 28px, login 64px, favicon 16px).
   - Auto-generación de favicon desde el logo principal.

5. **Paleta de colores sugerida**
   - Al elegir color primario, sugerir colores complementarios automáticamente.
   - Preview de cómo se ve el color en botones, badges, sidebar, links.
   - Validación de contraste WCAG AA para texto sobre el color.

6. **Presets de branding**
   - Templates predefinidos (corporativo azul, legal verde, financiero dorado).
   - Un clic aplica color + tipografía sugerida.

### P3 — Baja prioridad (diferenciadores)

7. **Custom domain**
   - Permitir que el cliente use su propio dominio (`marcas.miempresa.com`) en lugar del slug.
   - Requiere configuración DNS + certificado SSL.

8. **Onboarding wizard**
   - Al crear un nuevo tenant, guiar al superadmin paso a paso: nombre → slug → color → logo → usuarios → notificaciones.
   - Actualmente todo se configura después de la creación, lo que puede dejarse incompleto.

9. **Exports de configuración**
   - Descargar config actual como JSON para backup.
   - Importar config desde otro tenant (clonar configuración).

10. **Dark mode del portal**
    - Toggle para que el portal del cliente use dark mode.
    - Preview en ambos modos en la pestaña de branding.

---

## 📐 Principios de diseño aplicados

| Principio | Implementación |
|-----------|---------------|
| **Jerarquía visual** | Cards con bordes arena sobre fondo hueso, títulos en marino, descripciones en pizarra |
| **Feedback inmediato** | Preview en vivo del portal, validación inline del slug, mensajes de éxito/error con colores semánticos |
| **Proximidad** | Cada sección agrupa controles relacionados en una card, info contextual en columna lateral |
| **Consistencia** | Todos los inputs usan focus ring ámbar, botones de acción usan gradiente ámbar→oro |
| **Affordance** | Zona de upload con borde punteado + hover ámbar comunica "arrastra aquí" |
| **Progressive disclosure** | Las pestañas ocultan complejidad; el warning de cambio de slug solo aparece cuando hay un cambio real |

---

## 🎨 Tokens de diseño usados

- Fondo cards: `#F1EDE3` (hueso)
- Fondo inputs: `#FBF6EC` (marfil cálido)
- Borde: `#E2DED6` (gris arena)
- Texto título: `#0F2E3D` (azul marino profundo)
- Texto body: `#355B6F` (azul pizarra)
- Texto muted: `#C8C4B9` (gris piedra cálido)
- Focus ring: `#D39A2B` (ámbar sutil)
- CTA gradient: `#D39A2B → #E8B84A` (ámbar → oro)
- Tab activo: `#0F2E3D → #1C3F55` (marino → indigo)
- Éxito: `#2F6B4F`
- Error: `#B42318`
- Warning: `#D39A2B`
