# Space Cat — Página web para clientes (diseño)

Fecha: 2026-11-14 · Equipo: FSHF

## Intención y porqué
Crear una página web **nueva e independiente**, orientada a **clientes** (no
académica), para presentar y descargar la aplicación **Space Cat** (antes
Amoblador3D). La página del docente (`Amoblador3d_web`) se mantiene aparte y sin
cambios. El objetivo del cliente al llegar: entender qué hace el programa,
confiar en él y descargar el instalador.

## Marca y nombre
- Aplicación: **Space Cat**. Nombre corto **SC**.
- "SC" en la barra de la página y (más adelante) en la ventana e instalador de
  la app. "Space Cat" completo en el logo, la portada y los manuales.
- Empresa: **FSHF** (logo existente). Ciudad: Juliaca, Puno, Perú.
- Logo del producto: el gato en trazo (archivo que entregó el usuario,
  `C:\Users\A2024\Downloads\cat.jpg`). Se incorpora como SVG/PNG blanco sobre el
  fondo oscuro.
- Versión que se presenta: **Space Cat 1.0.0**, instalador `SC-Setup-1.0.0.exe`.

## Metas
- Una sola página (landing) clara, rápida y responsive (móvil incluido).
- Botón principal: **Descargar para Windows** (instalador, único método).
- Transmitir confianza: requisitos, huella SHA-256, aviso de SmartScreen,
  contacto por WhatsApp.
- Desplegable en GitHub Pages desde el repo `Space_Cat` (público, sin código).

## No metas / anti-metas
- **No** exponer el código fuente: sin sección de código, ingeniería ni enlaces
  al repo de Java. (Repo de la web `Space_Cat` solo con la web y manuales.)
- **No** ofrecer ZIP ni .jar: el instalador `.exe` es el único método.
- **No** contenido académico (actas, pruebas, atajos, equipo técnico detallado).
- **No** inventar testimonios ni reseñas falsas; si se usan, serán "casos de uso".
- **No** renombrar todavía la app Java ni la documentación (fase posterior).

## Alcance de ESTA entrega
Solo la **página web** en `C:\Users\A2024\amoblador3d\PW_Space_Cat`. El
renombrado de la aplicación, la ofuscación con ProGuard y la publicación del
Release quedan para fases siguientes acordadas por separado.

## Restricciones técnicas (elegidas por el usuario)
- **Astro** como framework del sitio.
- **Tailwind CSS** para el diseño.
- **Fomantic UI** (continuación mantenida de Semantic UI) solo para componentes
  puntuales (acordeón de FAQ, pestañas de funciones). Aislado para no chocar con
  Tailwind. Nota: Fomantic trae jQuery; se carga solo donde se usa.
- Salida estática, publicable en GitHub Pages (`base` configurado para el
  subpath del repo).

## Enfoque de construcción (único sensato)
Landing de una sola página en Astro con componentes `.astro` por sección.
Tailwind para layout y estilo; Fomantic solo en FAQ y pestañas. Se descartan:
multipágina (innecesario para una landing) y React/Next (peso y complejidad sin
beneficio aquí).

## Estilo visual: "Noche espacial"
- Fondo azul noche (p. ej. `#0b1020`–`#141a33`) con estrellas sutiles.
- El gato en trazo blanco como protagonista de la portada.
- Acento lavanda/cian para botones y detalles.
- Tipografía: un display con carácter + un cuerpo legible (a definir en build,
  p. ej. Space Grotesk / Inter). Una o dos familias, bien diferenciadas.
- Un solo momento animado de carga (p. ej. estrellas o el gato que aparece);
  respeta `prefers-reduced-motion`.

## Secciones (orden)
1. **Barra** — logo "SC" / Space Cat + navegación + botón Descargar.
2. **Portada (hero)** — logo del gato, titular, subtítulo, botón Descargar,
   versión. Imagen/captura de la app.
3. **Por qué Space Cat** — 3 datos: gratis · funciona sin internet · presupuesto
   en soles reales.
4. **Funciones** — 4 a 6, cada una con captura (3D, planta con medidas,
   recorrido, presupuesto, diseñador de muebles, modo noche). Pestañas (Fomantic).
5. **Cómo funciona** — 3 pasos: dibuja · amuebla · presupuesto.
6. **Para quién es** — familias, maestros de obra, mueblerías.
7. **Casos de uso** — 2–3 tarjetas (no testimonios inventados).
8. **Descarga** — solo instalador: versión, tamaño, requisitos, SHA-256, aviso
   SmartScreen. Manuales (usuario e instalación) como botones **"próximamente"**
   hasta la fase de documentación.
9. **Preguntas frecuentes** — orientadas a clientes (acordeón Fomantic).
10. **Sobre FSHF** — logo, ciudad, breve.
11. **Contacto** — botón WhatsApp a **+51 919 192 008**; íconos de redes
    sociales con enlaces `#` (sin destino por ahora).
12. **Pie** — enlaces, versión, nota de privacidad (sin internet, no recoge
    datos), © FSHF.

## Imágenes
Se reutilizan las capturas existentes de `Amoblador3d_web/img/` (muestran la UI
actual, que aún dice Amoblador3D; aceptable en esta fase, se reemplazan al
renombrar la app). El logo del gato se convierte a blanco para el fondo oscuro.

## Contenido / copy
- Tono cercano, en español, pensado para un cliente peruano.
- Textos reescritos (no copiados de la página del docente) con el nombre
  Space Cat y sin jerga técnica.

## Repositorio y despliegue
- Repo destino: `https://github.com/alex123floresc-sketch/Space_Cat.git`.
- Contiene: la web (Astro) + manuales (cuando existan). **Sin código de la app.**
- Despliegue: GitHub Pages. (La configuración y el primer push se confirman al
  finalizar; no se publica nada sin tu visto bueno.)

## Qué queda al constructor
- Elección final de fuentes y valores exactos de color dentro de la paleta.
- Estructura de carpetas de Astro y nombres de componentes.
- Detalle de la animación de carga.
- Redacción final de cada texto (se te muestra para revisar).

## Fases siguientes (fuera de esta entrega)
1. Renombrar la app Java a Space Cat (ventana, bienvenida, ícono, instalador,
   menú Inicio, PDF, carpeta de datos con migración de proyectos).
2. Reescribir manuales de usuario e instalación con el nombre Space Cat (solo
   método instalador) y generar los PDF.
3. Ofuscar con ProGuard y publicar `SC-Setup-1.0.0.exe` como Release.
