# Hospital Virtual ULEAM — matrícula por clave individual de curso

## Requisitos acordados (5 de noviembre de 2026)

1. Extensiones iniciales: **Chone, Tosagua y Pedernales**.
2. Un estudiante crea **una cuenta personal** usando nombres y apellidos, correo institucional y una contraseña que solo él conoce.
3. Un **curso** es la combinación de extensión, carrera, asignatura, período académico y paralelo. Los datos iniciales de la demostración todavía no son una oferta institucional confirmada.
4. **Cada curso recibe una clave de matrícula distinta**. La clave la crea o regenera el docente responsable (o administrador autorizado), y el estudiante la ingresa para solicitar o completar la matrícula en ese curso.
5. La contraseña personal **no** es una clave de matrícula. Cambiar la clave de un curso no debe afectar la contraseña de los estudiantes ni anular automáticamente las matrículas existentes.
6. Solo miembros matriculados deben recibir desde el servidor los recursos y resultados privados de su curso. La biblioteca de los 206 huesos está destinada a **Morfofisiología Básica / Fundamentos de Morfofisiología**, no al catálogo universal.
7. La inscripción debe quedar asociada al estudiante y a **un curso específico**, con estado, fecha y permisos. Un estudiante puede matricularse en varios cursos usando claves diferentes.
8. El docente podrá ver y gestionar solo sus cursos y estudiantes autorizados; el administrador tendrá permisos supervisados y auditables.
9. En una implementación con backend: almacenar secretos de forma segura (códigos de matrícula como verificadores protegidos; contraseñas gestionadas por un servicio de autenticación seguro), limitar intentos de códigos, permitir revocación/regeneración y revisar protección de datos y consentimiento pertinentes.
10. Probar que un estudiante no matriculado no puede consultar **ni directamente por URL ni por llamadas de red** los materiales protegidos o las notas de otro curso.

## Estado actual

La web de GitHub Pages es estática y **no contiene un backend ni un sistema de usuarios**. Se ha preparado:
- selector por extensión y carrera;
- catálogo de cursos ilustrativo con identificadores distintos por extensión;
- indicador deshabilitado para la futura clave de matrícula;
- biblioteca de huesos enlazada desde la vista previa de Fundamentos de Morfofisiología, sin enlace en el menú general;
- progreso local de demostración separado por curso.

**La matrícula real todavía no existe.** No introducir nombres reales de estudiantes, contraseñas ni claves privadas en GitHub, en JSON de respaldo o en `localStorage`. Ocultar un botón no es control de acceso y el código/frontend de GitHub Pages es público.

## Implementación pendiente

- Elegir y configurar un servicio de autenticación y base de datos con reglas de autorización verificadas en el servidor.
- Modelo mínimo: perfiles, extensiones, carreras, cursos, docentes responsables, claves de invitación/verificadores y matrículas.
- Flujo: crear cuenta → elegir extensión → elegir curso → introducir clave del curso → validación del servidor → matrícula → acceder a recursos autorizados.
- Panel docente: crear cursos, definir/rotar clave individual, revisar matriculados, administrar contenido del curso.
- Progreso de biblioteca y calificaciones individuales persistentes en el servidor.
- Pruebas automatizadas de autorización, denegación y aislamiento entre extensiones, cursos y estudiantes.
