# HOSPITAL VIRTUAL ULEAM

Hospital general educativo para estudiantes de **Enfermería y Fisioterapia**, sin restricción a una sede. Primera etapa funcional con React, TypeScript y Vite. Sin backend, APIs externas, servicios de pago ni logotipos oficiales.

> Es una simulación educativa, no un hospital real ni una herramienta institucional oficialmente aprobada. Todos los personajes y pacientes son ficticios. No sustituye atención profesional, protocolos clínicos ni supervisión docente. No introduzcas datos personales o clínicos reales.

## Iniciar

Requiere Node.js **24** (incluido en `.nvmrc`) y npm. También es compatible con los requisitos de Vite 7: Node 20.19+ o 22.12+.

```bash
cd /workspace/hospital-virtual-uleam  # o la carpeta de tu clon
npm ci
npm run dev
```

Vite indica el puerto en la terminal (5173 por defecto). Para compilar y comprobar la distribución:

```bash
npm test
npm run build
npm run preview
```

`dist/` contiene el sitio estático. No se debe abrir `index.html` con `file://`: úsalo mediante un servidor HTTP. No hay variables de entorno, claves ni servicios adicionales que configurar.

## Qué funciona en la etapa 1

- Panel de bienvenida con indicadores calculados sobre los datos locales y progreso real de la demostración.
- Mapa esquemático navegable y vista de fichas para **18 áreas**: admisión, triaje, emergencias, consulta externa, hospitalización, enfermería, medicina interna, pediatría, ginecoobstetricia, quirófano, UCI, laboratorio, imagenología, farmacia, fisioterapia, dirección, bioseguridad y aulas de simulación.
- Fichas de áreas con funciones, cargos vinculados y actividades disponibles. Las áreas desactivadas se ocultan del hospital y sus actividades dejan de estar disponibles, sin perder historial.
- Recorrido **carrera → asignatura → unidad/contenido → actividad → resultado**, además del acceso por departamentos y el catálogo de prácticas.
- Carreras Enfermería y Fisioterapia; Fundamentos de Morfofisiología, Biología en ambas carreras, Morfofisiología Aplicada **sin carrera asignada** y prácticas complementarias de Fisioterapia. La carrera y docente de referencia se asignan desde la misma administración central.
- Contenidos introductorios en seis unidades: estructura y función, cuidados, célula y reparación, biología del movimiento, anatomía aplicada y valoración funcional. Se pueden crear unidades y enlaces multimedia externos (HTTP/HTTPS). No hay carga de archivos multimedia ni biblioteca de imágenes clínicas.
- Organigrama jerárquico con cargos, responsabilidades y profesionales/estudiantes/docentes **ficticios**. Permite reorganizar dependencias y detecta ciclos.
- Administración central con creación, edición y eliminación de áreas, carreras, asignaturas, unidades, cargos, personas y casos/actividades/evaluaciones; edición del nombre y bienvenida. Confirmación de eliminaciones y bloqueo de relaciones en uso. Reasigna las referencias antes de eliminar; para áreas puedes desactivar en lugar de eliminar.
- Editor de casos con contexto/paciente, antecedentes, signos vitales, hallazgos, carrera, asignatura, unidad, área, modalidad y dificultad. Agrega, edita, elimina y sube pasos; agrega o elimina opciones y define sus puntajes y explicaciones.
- Motor **secuencial**: una decisión por paso, confirmación, consecuencia educativa y explicación inmediata. Un paso necesita entre 2 y 8 opciones y al menos una de 100 puntos. Se puntúa el promedio de los pasos, redondeado a entero; no penaliza el tiempo. El orden de opciones no se aleatoriza en esta etapa.
- Historial con decisiones y retroalimentación. Los intentos conservan una copia de las respuestas y el nombre del caso aunque el contenido se modifique o elimine. La administración puede revisar y eliminar resultados demostrativos. No son calificaciones académicas oficiales.
- Exportación y restauración JSON de **todo** el contenido y resultados locales. La importación valida versión, relaciones y estructura; solicita confirmación antes de reemplazar. Límite de 5 MB por respaldo.
- Interfaz responsive, navegación móvil, foco visible, etiquetas de formularios, enlace de salto al contenido y ventanas con gestión de foco y cierre con Escape.

### Seis actividades iniciales

| Experiencia                          | Asignatura                     | Área         |
| ------------------------------------ | ------------------------------ | ------------ |
| Primeros minutos en triaje           | Fundamentos de Morfofisiología | Triaje       |
| Manos seguras, cuidados seguros      | Fundamentos de Morfofisiología | Bioseguridad |
| El hueso también tiene una función   | Fundamentos de Morfofisiología | Simulación   |
| Volver a moverse con confianza       | Prácticas de Fisioterapia      | Fisioterapia |
| La energía detrás de la recuperación | Biología de Enfermería         | Laboratorio  |
| Escuchar antes de cuidar             | Fundamentos de Morfofisiología | Enfermería   |

Cada actividad incluye tres decisiones con puntuación y explicación de **todas** las opciones. Los contenidos son ejemplos iniciales que requieren revisión y adaptación docente antes de utilizarse en una evaluación. Algunas áreas y asignaturas solo tienen contenido introductorio: sus fichas indican cuando aún no hay actividades; el administrador puede crearlas sin modificar código.

## Administración y datos locales

Abre **Administración** en el menú lateral. Existe un solo panel central, sin paneles independientes por docente. La identificación «Demo educativa» es una etiqueta: **no existe inicio de sesión ni control de acceso seguro**. Cualquier persona que abra el sitio en ese navegador puede editar sus datos locales.

La clave de almacenamiento es `hv-uleam:v1` en `localStorage`. Los cambios sobreviven a recargas en el mismo navegador y origen, pero **no se sincronizan entre computadoras, perfiles, dominios o puertos**, ni forman una base de datos compartida. Borrar datos del navegador elimina el contenido local. La navegación privada o una cuota llena pueden impedir guardar; la aplicación informa el error sin afirmar que guardó.

Para respaldar: Administración → **Exportar JSON**. Para restaurar: **Importar JSON** → selecciona el archivo → confirma el reemplazo. Exporta primero los datos actuales: la importación no fusiona colecciones. Si no hay datos guardados se carga la demostración. Si hay datos corruptos se muestra una advertencia y se conservan hasta un guardado explícito. El respaldo JSON no está cifrado; usa únicamente información ficticia.

## Pruebas

```bash
npm test                 # Vitest: repositorio, validación y componentes
npm run build            # TypeScript estricto y Vite
npx playwright install chromium   # una vez, para pruebas de navegador
npm run test:e2e          # recorridos completos en escritorio y móvil
```

Si Chromium ya está instalado en Linux:

```bash
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

Las pruebas E2E levantan Vite en el puerto 4173 y comprueban recorrido académico, simulación, persistencia al recargar, CRUD, edición de casos, respaldo exportado e importado, mapa y organigrama. Las capturas y trazas quedan en `test-results/` (ignorado por Git). No prueban seguridad multiusuario porque no existe autenticación. En CI sin navegador, instalar Chromium y dependencias con `npx playwright install --with-deps chromium` antes de ejecutar E2E.

## Desplegar en GitHub Pages

La aplicación utiliza rutas internas en memoria y `base: './'`: la compilación funciona bajo el subdirectorio del repositorio sin servidor de rutas. Una recarga vuelve al panel de inicio y conserva los datos locales.

1. Sube los cambios al repositorio en GitHub.
2. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions**.
3. En **Actions → Publicar en GitHub Pages → Run workflow**, ejecuta el flujo manual incluido en `.github/workflows/pages.yml`.
4. El flujo instala con `npm ci`, ejecuta pruebas y compilación, y publica `dist/` mediante las acciones oficiales de Pages. GitHub mostrará la dirección cuando termine.

No se ha publicado automáticamente ni enviado cambios remotos desde esta implementación. El despliegue requiere permisos del propietario y disponibilidad de Pages en el repositorio. No contiene claves ni servicios de pago. Los cambios hechos en el panel del sitio publicado seguirán siendo locales al navegador; no modifican GitHub ni el contenido inicial de otros visitantes.

## Arquitectura

```text
src/
  model.ts                 Contratos de dominio y cálculo de resultados
  schema.ts                Campos y relaciones de la administración
  data/seed.ts             Hospital, estructura académica y casos ficticios
  services/repository.ts   Contrato Repository, localStorage y validación JSON
  components/Admin.tsx     Formularios, editor de pasos y respaldos
  components/Simulator.tsx Motor secuencial y resultados
  components/Modal.tsx     Ventana accesible y control de foco
  App.tsx                  Navegación, hospital, academia y organigrama
  styles.css               Diseño responsive sin fuentes remotas
```

`Repository` separa persistencia de la interfaz. Una siguiente etapa deberá incorporar operaciones asíncronas y un repositorio remoto, migraciones, autorización en el servidor y tratamiento de errores de red; cambiar el almacenamiento por sí solo no aporta seguridad. Los identificadores permiten vincular entidades sin depender de sus nombres. El formato del respaldo tiene versión para futuras migraciones.

## Qué queda para siguientes etapas

- **Etapa 2:** pacientes con estado dinámico, ramificación entre pasos, evolución temporal y consecuencias fisiológicas. Actualmente las consecuencias son explicaciones educativas en un recorrido secuencial; no hay un modelo fisiológico de paciente.
- **Etapa 3:** estudiantes que asumen cargos, responsabilidades ejecutables, recursos hospitalarios y colaboración. Actualmente los cargos y personas son registros editables que ilustran la organización.
- **Etapa 4:** usuarios reales, autenticación, permisos efectivos, grupos, base de datos compartida, seguimiento y calificaciones persistentes. Actualmente toda identidad y evaluación es demostrativa.
- **Etapa 5:** integraciones académicas, reportes y escenarios adicionales.

La etapa 1 no incluye atención asistencial, prescripción, pacientes reales, expedientes clínicos ni comunicación entre usuarios.
