# Panel docente · Hospital Virtual ULEAM

## Acceso desde el hospital

1. Inicia sesión como administrador o docente responsable del curso.
2. En **Cursos disponibles**, selecciona **Abrir aula**.
3. En la parte superior del aula verás **Panel docente** y estas secciones:
   - **Entregas y notas**: respuestas enviadas, nota individual y retroalimentación.
   - **Estudiantes y avances**: nómina autorizada del curso, estado de matrícula y huesos marcados como estudiados (solo Morfofisiología).
   - **Crear actividades**: publicar actividades o evaluaciones de respuesta escrita con puntaje máximo y fecha límite opcional; publicar lecturas en texto.

## Estudiantes

Quien esté matriculado con la clave del curso puede:
- Consultar instrucciones de las actividades y las lecturas publicadas.
- Escribir y entregar su respuesta, o modificarla mientras siga abierto el plazo y aún no haya sido calificada.
- Consultar únicamente sus propias notas y retroalimentación.
- Marcar como estudiados los 206 huesos en Morfofisiología; cada avance se almacena por estudiante y curso.

Las evaluaciones de esta versión son **de respuesta escrita con calificación manual**. No incluyen preguntas de opción múltiple, carga de archivos, evaluación automática ni transferencia de notas a Moodle. Las notas son internas del prototipo y no constituyen registros oficiales.

## Protección de datos

- El acceso al curso exige matrícula activa.
- Las tablas de actividades y entregas aplican RLS en Supabase.
- La nómina se obtiene con una función que comprueba los permisos docentes; no se abre acceso global a nombres de estudiantes.
- Los estudiantes no pueden insertar ni modificar directamente calificaciones; solo el docente autorizado puede usar la función de calificación.
- Las claves de matrícula mantienen su validación independiente para cada curso y extensión.
- Se comprobó que un usuario autenticado sin matrícula no puede consultar los materiales de Morfofisiología mediante la API.
- Quedan pendientes una revisión de seguridad integral y la aprobación institucional antes de incorporar información académica oficial.

## Migraciones de este avance

1. `supabase/migrations/20261105_teacher_panel.sql`
2. `supabase/migrations/20261105_restrict_grade_access.sql`

Ambas ya se aplicaron y comprobaron en el proyecto Supabase del hospital. El código frontend está versionado en GitHub.
