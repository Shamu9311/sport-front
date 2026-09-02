Quiero que mejores la interfaz visual de mi aplicación móvil desarrollada con React Native + Expo.

IMPORTANTE:
- Analiza primero toda la estructura actual del frontend antes de modificar archivos.
- NO cambies lógica de negocio, endpoints, navegación, funcionalidades, modelos ni comportamiento de la aplicación.
- NO elimines funcionalidades existentes.
- Mantén expo-router.
- Mantén compatibilidad con iOS y Android.
- El objetivo es únicamente mejorar UI, UX visual y animaciones.
- No quiero copiar exactamente Strava. Usa como inspiración su lenguaje visual: limpio, deportivo, moderno, energético y con alto contraste.
- Reutiliza componentes y crea un sistema visual consistente; evita estilos duplicados pantalla por pantalla.

Actualmente la aplicación utiliza principalmente fondo negro/gris oscuro con detalles dorados. El fondo oscuro actual se siente demasiado pesado y quiero una interfaz más fresca y deportiva.

==================================================
1. NUEVA IDENTIDAD VISUAL
==================================================

Quiero una estética deportiva moderna inspirada ligeramente en aplicaciones como Strava:

- Fondos claros o neutros, evitando que toda la aplicación sea negro puro.
- Mucho espacio visual.
- Tarjetas limpias.
- Jerarquía tipográfica marcada.
- Información deportiva fácil de escanear rápidamente.
- Una única tonalidad principal de acento en lugar de utilizar dorado en exceso.

Propón una paleta coherente, por ejemplo:

Background principal:
#F7F7F5 o similar.

Cards:
#FFFFFF

Texto principal:
#1C1C1C

Texto secundario:
#6B6B6B

Bordes:
#E8E8E8

Color principal de marca:
utiliza un naranja/coral deportivo inspirado en la energía visual de Strava, PERO NO copies exactamente su color corporativo.
Ejemplo aproximado:
#F05A3C / #F26445

Puedes ajustar estos tonos si encuentras una combinación visual mejor.

Usa el color principal únicamente para:
- botones principales;
- elementos seleccionados;
- indicadores;
- iconos activos;
- pequeñas llamadas visuales.

Evita llenar grandes superficies con naranja.

==================================================
2. DARK MODE
==================================================

No elimines completamente el modo oscuro si ya es fácil soportarlo.

Idealmente crea tokens para:

light:
background
surface
surfaceSecondary
primary
text
textSecondary
border
success
warning
danger

dark:
sus equivalentes.

Pero la apariencia principal que quiero evaluar ahora es LIGHT MODE.

No hardcodees colores por toda la aplicación.

Crear o mejorar algo como:

theme/
  colors.ts
  typography.ts
  spacing.ts
  radius.ts
  shadows.ts

o una estructura equivalente compatible con el proyecto actual.

==================================================
3. TIPOGRAFÍA
==================================================

Quiero una tipografía deportiva, limpia y moderna.

Si actualmente no hay una fuente personalizada, considera:

Inter

o

Manrope

mediante expo-font / Google Fonts si encaja correctamente con el proyecto.

Utiliza una jerarquía consistente:

Título principal:
28-32 px
peso 700/800

Título de sección:
20-24 px
peso 700

Título de tarjeta:
16-18 px
peso 600/700

Texto:
14-16 px
peso 400/500

Texto secundario:
13-14 px

Datos deportivos importantes:
peso 700/800.

No abuses del bold.

==================================================
4. BARRA DE NAVEGACIÓN
==================================================

Mantén las pestañas actuales:

Inicio
Productos
Entrenar
Sugerencias
Perfil

Rediseña el tab bar para que:

- tenga fondo claro;
- tenga separación visual superior muy sutil;
- iconos inactivos en gris;
- icono y texto activos con el color principal;
- altura cómoda;
- respete SafeArea;
- mantenga el mismo comportamiento actual.

Evita sombras excesivas.

==================================================
5. PANTALLA INICIO
==================================================

La pantalla actual tiene buen contenido, pero quiero que parezca más un dashboard deportivo.

Mantén:
- saludo;
- estadísticas;
- información sobre IA;
- navegación.

Rediseña:

"¡Hola, SamuelP!"
como encabezado limpio y deportivo.

La sección "Tu actividad" debe parecer un resumen de rendimiento:

Esta semana
Tiempo total
Entrenamientos

Presentar las métricas en cards más ligeras, con números grandes y etiquetas pequeñas.

Evitar una tarjeta gris enorme sobre fondo negro.

La sección informativa inferior debe tener menos peso visual.

==================================================
6. PRODUCTOS
==================================================

Esta pantalla debe recibir una mejora importante.

Mantener:
- búsqueda;
- categorías;
- momento;
- listado;
- navegación al detalle.

Cambios:

- Fondo claro.
- Search bar minimalista.
- Chips de filtros más compactos.
- Chip seleccionado con color principal.
- Chips no seleccionados con fondo gris muy claro.
- Tarjetas de producto blancas.
- Imagen con fondo limpio.
- Nombre como elemento principal.
- Descripción secundaria.
- "Ver producto" como acción visual discreta.

Reducir altura innecesaria de cada card para que entren más productos sin perder legibilidad.

Agregar feedback táctil/visual al presionar filtros y cards si resulta apropiado.

==================================================
7. ENTRENAMIENTOS
==================================================

Quiero que esta pantalla sea una de las más deportivas.

Mantener:
- listado de entrenamientos;
- botón Nuevo;
- swipe/eliminación;
- detalles existentes.

Rediseñar cada entrenamiento para mostrar claramente:

Fecha
Deporte
Duración
Intensidad
Tipo

Utilizar iconos discretos.

El botón "Nuevo" puede convertirse en un FAB o botón compacto destacado con el color principal.

Las cards deben tener:
- fondo blanco;
- borde/sombra muy sutil;
- radio consistente;
- información mejor alineada.

La intensidad puede representarse mediante pequeños badges.

==================================================
8. MODAL AGREGAR ENTRENAMIENTO
==================================================

Mantener exactamente los campos y comportamiento existentes.

Mejorar:

- jerarquía;
- separación entre secciones;
- inputs claros;
- chips para opciones;
- selector de fecha;
- botones Cancelar / Guardar.

"Guardar":
botón principal sólido.

"Cancelar":
botón secundario/outline.

El modal debe sentirse menos pesado que el actual.

Si el contenido supera la pantalla, asegurar ScrollView + KeyboardAvoidingView correctamente.

==================================================
9. SUGERENCIAS / RECOMENDACIONES
==================================================

Actualmente las cards contienen bastante información y se sienten visualmente pesadas.

Mantener:
- pestaña Bueno / Malo;
- imagen;
- nombre;
- descripción;
- explicación de recomendación;
- detalle;
- feedback.

Rediseñar:

Tabs:
"Me sirvieron"
"No me sirvieron"

más compactos.

Cards:
- blancas;
- imagen bien delimitada;
- nombre destacado;
- descripción breve;
- explicación personalizada en una sección secundaria visualmente diferenciada.

La sección "Recomendado para ti" debe destacar, pero sin convertir media tarjeta en un bloque de color.

Puede usar:
- línea vertical en color principal;
- icono;
- fondo primary con opacidad muy baja.

==================================================
10. PERFIL
==================================================

Mantener toda la información existente.

Rediseñar siguiendo una estética similar a un perfil deportivo:

Cabecera:
avatar
username
email

Después dividir en cards:

Información personal
Actividad deportiva
Preferencias
Notificaciones / Configuración

Los valores importantes como:
edad
peso
altura

pueden presentarse como pequeñas métricas horizontales.

Reducir bloques demasiado grandes.

==================================================
11. ANIMACIONES
==================================================

Quiero animaciones sutiles, modernas y útiles.

Usa React Native Reanimated si ya está instalado o si puede añadirse sin afectar el proyecto.

NO quiero animaciones exageradas.

Implementa cuando tenga sentido:

- aparición suave de cards;
- pequeño scale/opacity al pulsar botones;
- transición de filtros/chips;
- animación al cambiar de tab;
- entrada suave de modales;
- animación de carga mientras se generan recomendaciones;
- transición al aparecer las recomendaciones;
- feedback visual al seleccionar Bueno/Malo.

Duraciones aproximadas:
150-300 ms.

Mantener 60 FPS siempre que sea posible.

Respetar Reduce Motion si Expo/React Native permite detectarlo de forma sencilla.

==================================================
12. LOADING STATES
==================================================

Mejorar especialmente el proceso de generación de recomendaciones.

En vez de mostrar únicamente un spinner genérico, crear un estado de carga elegante:

"Analizando tu entrenamiento..."
"Buscando productos adecuados..."
"Generando recomendaciones personalizadas..."

Puede cambiar el mensaje progresivamente, pero NO debe inventar progreso real en porcentaje.

Utilizar una animación discreta.

==================================================
13. COMPONENTES REUTILIZABLES
==================================================

Antes de duplicar estilos, identifica elementos reutilizables.

Crear/refactorizar cuando sea útil:

AppCard
AppButton
FilterChip
SectionHeader
MetricCard
EmptyState
LoadingState
FeedbackButton
ScreenContainer

No sobrearquitectures el proyecto.

==================================================
14. ACCESIBILIDAD
==================================================

Revisar:

- contraste;
- tamaños táctiles;
- labels;
- accessibilityRole;
- textos legibles;
- Safe Areas;
- tamaños dinámicos donde sea viable.

Evitar textos secundarios excesivamente claros.

==================================================
15. LO QUE NO QUIERO
==================================================

NO:
- cambiar endpoints;
- cambiar modelos;
- modificar base de datos;
- tocar RAG;
- modificar autenticación;
- eliminar funcionalidades;
- modificar reglas de feedback;
- introducir nuevas funcionalidades de negocio;
- copiar literalmente la UI de Strava;
- utilizar logos o assets de Strava;
- llenar toda la aplicación de naranja;
- usar gradientes innecesarios;
- abusar de sombras;
- utilizar animaciones llamativas;
- romper las pruebas existentes.

==================================================
16. PRUEBAS
==================================================

Después de realizar los cambios:

1. Ejecuta todas las pruebas actuales.
2. Corrige cualquier test roto debido exclusivamente a cambios visuales legítimos.
3. NO elimines tests para conseguir que pasen.
4. Confirma que la lógica sigue igual.
5. Ejecuta TypeScript/lint si existen comandos configurados.

==================================================
17. ENTREGA
==================================================

Al finalizar:

1. Muéstrame qué archivos modificaste.
2. Explica brevemente el nuevo sistema visual.
3. Indica la paleta final elegida.
4. Indica la tipografía utilizada.
5. Enumera los componentes reutilizables creados.
6. Enumera las animaciones agregadas.
7. Confirma qué pruebas ejecutaste y el resultado.
8. Crea un archivo `UI_REDESIGN_REPORT.md`.
9. NO modifiques la lógica de negocio.

Antes de escribir código, analiza primero la UI actual y dame un plan corto de los cambios que vas a realizar. Después implementa todo el rediseño.