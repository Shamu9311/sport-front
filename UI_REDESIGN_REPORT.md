# UI Redesign Report — Sport-Funcional

Rediseño visual completo (solo UI/UX): estética deportiva inspirada en el lenguaje visual de apps como Strava y alineada con la identidad de [Science in Sport](https://www.scienceinsport.com/eu/) (fondo negro, tipografía blanca, acento rojo). **No se modificó lógica de negocio, endpoints, modelos, autenticación, RAG ni reglas de feedback.**

---

## 1. Sistema visual

- **Fuente única de verdad**: `src/theme/index.ts`. Se exportan dos paletas (`palettes.light` y `palettes.dark`); la activa es **dark (estilo SiS)**. Ninguna pantalla hardcodea colores: todo consume tokens.
- Fondo negro puro, cards oscuras con borde hairline y sombra sutil, acento rojo SiS en botones principales, chips seleccionados, indicadores e iconos activos.
- Jerarquía tipográfica marcada: títulos grandes extrabold en blanco, secciones bold, texto secundario gris claro, métricas deportivas con números grandes.

## 2. Paleta final (dark — estilo Science in Sport)

| Token | Valor | Uso |
|---|---|---|
| `background` | `#000000` | Fondo de pantallas (negro puro, como la web SiS) |
| `surface` | `#161616` | Cards |
| `surfaceElevated` | `#1D1D1D` | Cards elevadas / highlight |
| `surfaceMuted` | `#0D0D0D` | Chips no seleccionados, inputs |
| `textPrimary` | `#FFFFFF` | Texto principal |
| `textSecondary` | `#B3B3B3` | Texto secundario |
| `textMuted` | `#7A7A7A` | Texto terciario |
| `border` | `#2A2A2A` | Bordes |
| `divider` | `#1F1F1F` | Divisores |
| `primary` | `#E8362D` | Acento rojo SiS |
| `primaryPressed` | `#C22A22` | Estado presionado |
| `primarySoft` | `rgba(232,54,45,0.15)` | Fondos destacados ("Recomendado para ti") |
| `categoryEnergy` / `Soft` | `#E8362D` / `rgba(232,54,45,0.15)` | Línea Energy |
| `categoryHydration` / `Soft` | `#3E9BE0` / `rgba(62,155,224,0.15)` | Línea Hydration |
| `categoryRecovery` / `Soft` | `#9B6DE8` / `rgba(155,109,232,0.15)` | Línea Recovery |
| `categorySupplement` / `Soft` | `#4CBB7F` / `rgba(76,187,127,0.15)` | Línea Supplements |
| `success` / `warning` / `error` / `info` | `#4CBB7F` / `#E0A03E` / `#E05252` / `#5BA2E6` | Estados |

La paleta `light` queda definida como alternativa para evaluación futura.

## 3. Tipografía

**Inter** (ya existente vía `@expo-google-fonts/inter`), añadiendo el peso **Inter_800ExtraBold**:

- Título de pantalla: 28 px extrabold, letter-spacing −0.5
- Título de sección: 20 px bold
- Título de card: 16–17 px semibold/bold
- Texto: 14–15 px regular
- Secundario: 13 px
- Métricas deportivas: 26 px extrabold

## 4. Componentes reutilizables creados (`src/components/ui/`)

| Componente | Rol |
|---|---|
| `AppCard` | Card estándar o `highlight` (borde superior rojo, fondo elevado) |
| `PressableScale` | Feedback táctil scale+opacity + haptics opcionales (`light` / `success` / `selection`) |
| `FilterChip` | Chip compacto con color de acento configurable por categoría |
| `SectionHeader` | Encabezado con barra roja vertical + overline opcional estilo SiS |
| `ScreenHero` | Degradado rojo sutil en la parte superior de pantallas |
| `MetricCard` | Métrica deportiva: número grande + etiqueta pequeña |
| `EmptyState` | Estado vacío consistente (icono, título, acción) |
| `LoadingState` | Carga elegante con mensajes progresivos (sin porcentajes inventados) |
| `ScreenContainer` | SafeArea + fondo oscuro + status bar clara |

Utilidades: `src/utils/categoryColors.ts` (mapeo Energy/Hydration/Recovery/Supplement), `src/utils/haptics.ts`.

Se restylearon los existentes: `CustomButton` (degradado rojo + sombra), `SelectField`, `SkeletonLoader`, `TrainingSessionItem`, `NetworkErrorBanner`, `AuthForm` (vía tokens).

## 5. Cambios por pantalla

- **Tab bar**: fondo oscuro (`surface`), indicador rojo bajo tab activa, transición `shift`.
- **Inicio**: `ScreenHero` con degradado rojo, secciones con `SectionHeader` (barra roja + overline), carrusel en `AppCard highlight`, acceso rápido con iconos en círculos de color por categoría, más aire entre secciones (`spacing.xxxl`).
- **Productos**: franja lateral de color por categoría en cada card, chips de filtro con color de su línea de producto, pull-to-refresh tintado rojo.
- **Entrenamientos**: `ScreenHero` en header, badge de intensidad alineado a escala de categorías (verde → azul → rojo → error).
- **Sugerencias**: `ScreenHero` en header, haptics al cambiar tabs.
- **Perfil**: edad/peso/altura con `AnimatedNumber` animado.
- **Modal agregar entrenamiento**: card oscura redondeada, labels tipo overline, inputs con fondo muted, chips consistentes, Guardar sólido / Cancelar outline, `KeyboardAvoidingView` + ScrollView.
- **Sugerencias**: tabs segmentados compactos ("Me sirvieron / No me sirvieron"), cards oscuras con imagen delimitada, sección "Recomendado para ti" con línea vertical roja + icono + fondo `primarySoft`.
- **Detalle de entrenamiento**: bottom sheet con drag handle, header ligero, stats con números extrabold, guía de consumo suavizada, botones de feedback Bueno/Malo tipo pill con estado activo verde/rojo.
- **Perfil**: cabecera avatar/usuario/email, métricas edad/peso/altura como mini-cards horizontales, cards de información con divisores sutiles, Editar sólido + Cerrar sesión outline.
- **Login / Registro / Crear perfil / Loading**: heredan tokens; logo sin recorte, títulos en textPrimary blanco, sombras suavizadas.
- **Detalle de producto**: hero limpio, chips de sabores/beneficios con tinte rojo suave, grid nutricional con valores extrabold.

## 6. Animaciones agregadas (150–300 ms, sutiles)

1. Scale + opacity al presionar botones, chips y cards (`PressableScale`, Reanimated, respeta Reduce Motion).
2. Aparición suave de cards (`FadeInDown` 250 ms con stagger) en Entrenamientos y Sugerencias.
3. Transición `shift` al cambiar de tab.
4. Mensajes de carga progresivos con crossfade ("Analizando tu entrenamiento…" → "Buscando productos adecuados…" → "Generando recomendaciones personalizadas…") al generar recomendaciones (AddTrainingModal y TrainingDetailModal).
5. Entrada de modales (fade + slide, ya existente, conservada) y carrusel de features (fade 300 ms).
6. Shimmer de skeletons adaptado al tema oscuro (`rgba(255,255,255,0.07)`).
7. Haptics: impacto ligero en chips/cards, éxito al guardar entrenamiento o dar feedback, selección en tabs de Sugerencias.
8. Botón primario con degradado rojo SiS y sombra de color.

## 7. Accesibilidad

- `accessibilityRole` / `accessibilityLabel` / `accessibilityState` en chips, tabs, botones de cerrar/eliminar y cards presionables.
- Contraste: texto principal #FFFFFF sobre negro, secundario #B3B3B3 (≥ 4.5:1); textos sobre rojo SiS en blanco (`textOnPrimary`).
- Áreas táctiles ≥ 32 px con `hitSlop` en iconos pequeños.
- Safe Areas respetadas en todas las pantallas y tab bar.

## 8. Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `npm test` (Jest) | ✅ **7 suites / 17 tests, todos pasan** |
| `npm run lint` (expo lint) | ✅ 0 errores (28 warnings, casi todos preexistentes: deps de hooks, variables sin usar) |
| `npx tsc --noEmit` | ⚠️ Errores **preexistentes** en tipados de lógica no tocada (`SavedRecommendation`, `defaultProps` con React 19, triggers de `expo-notifications`). Ninguno proviene del rediseño; el proyecto no tiene script de typecheck configurado. |

Ajustes de test legítimos por cambios visuales:
- `TrainingDetailModal.test.tsx`: la aserción del texto de carga pasó de "Buscando recomendaciones..." al nuevo primer mensaje "Analizando tu entrenamiento...".
- `package.json`: `testTimeout: 30000` (el primer render por suite superaba los 5 s por defecto en máquinas lentas). **No se eliminó ningún test.**

## 9. Archivos modificados / creados

**Creados**
- `src/components/ui/AppCard.tsx`, `PressableScale.tsx`, `FilterChip.tsx`, `SectionHeader.tsx`, `MetricCard.tsx`, `EmptyState.tsx`, `LoadingState.tsx`, `ScreenContainer.tsx`, `ScreenHero.tsx`
- `src/utils/categoryColors.ts`, `src/utils/haptics.ts`
- `UI_REDESIGN_REPORT.md`

**Modificados (fase secciones + microinteracciones)**
- `src/theme/index.ts` (tokens categoría, surface/border ajustados, sombra botón)
- `app/(tabs)/index.tsx`, `products.tsx`, `training.tsx`, `recommendations.tsx`, `profile.tsx`, `_layout.tsx`
- `src/components/CustomButton.tsx`, `AddTrainingModal.tsx`, `TrainingDetailModal.tsx`, `TrainingSessionItem.tsx`
- `package.json` (`expo-linear-gradient`)

## 10. Fase de refinamiento (post-evaluación)

1. **Marcos de imagen de producto** (`src/components/ui/ProductImageFrame.tsx`): contenedor blanco deliberado con radio y borde sutil para las fotos con fondo blanco, aplicado en Productos, Sugerencias, detalle de producto y `TrainingDetailModal`. Skeletons ajustados a las nuevas dimensiones.
2. **Disciplina de color**: nuevo token `primaryText` (`#FF5A50` en dark) para texto rojo pequeño sobre negro con contraste suficiente; aplicado en "Ver producto/detalles", chips de sabores/beneficios, botón outline, opción activa de `SelectField`, textos destacados y links de Perfil/crear-perfil.
3. **Inicio orientado al uso**: orden ahora es saludo → Tu actividad → Acceso rápido; "¿Por qué SIS?" y "Cómo funciona" solo se muestran a usuarios sin entrenamientos (`showOnboarding`).
4. **Eliminar con deshacer**: swipe en Entrenamientos elimina de forma optimista y muestra toast "Toca aquí para deshacer" (4 s); la llamada a la API solo se ejecuta si no se deshace, y ante error de red el item se restaura. Se eliminó el `Alert` de confirmación. Toast `info` estilizado para el tema oscuro en `app/_layout.tsx`.
5. **ScreenHero solo en Inicio**: se retiró el degradado de Entrenamientos y Sugerencias para conservar el efecto.

Verificación de esta fase: 7 suites / 17 tests pasan, lint sin errores.

**Modificados**
- `src/theme/index.ts` (tokens light/dark, paleta activa dark estilo SiS, tipografía, sombras)
- `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`, `products.tsx`, `training.tsx`, `recommendations.tsx`, `profile.tsx`
- `app/products/[productId].tsx`, `app/login.tsx`, `app/register.tsx`, `app/create-profile.tsx`, `app/loading-profile.tsx`
- `src/components/AddTrainingModal.tsx`, `TrainingDetailModal.tsx`, `TrainingSessionItem.tsx`, `SkeletonLoader.tsx`, `SelectField.tsx`, `NetworkErrorBanner.tsx`
- `src/services/notificationService.ts` (solo color LED de notificación)
- `__tests__/TrainingDetailModal.test.tsx`, `package.json` (timeout de Jest)
