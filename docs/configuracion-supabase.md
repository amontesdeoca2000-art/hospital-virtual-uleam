# Activación de matrículas reales por curso — Hospital Virtual ULEAM

**Estado:** implementación preparada en código, **no operativa hasta conectar un proyecto Supabase y probar sus políticas**. La página actual usa una demo local cuando no están configuradas las variables.

## 1. Crear proyecto Supabase

1. Entra a https://supabase.com/dashboard e inicia sesión (o crea cuenta).
2. Crea un proyecto para el Hospital Virtual ULEAM. Elige contraseña de base de datos **única** y guárdala fuera de GitHub.
3. Abre **SQL Editor**. Revisa y ejecuta el archivo `supabase/migrations/20261105_course_enrollment.sql` del repositorio.
4. En **Authentication → Providers → Email**, habilita correo y contraseña, preferentemente **confirmación de email** y medidas de protección contra abuso.
5. En **Authentication → URL Configuration**, registra la URL publicada `https://amontesdeoca2000-art.github.io/hospital-virtual-uleam/` como URL permitida de redirección. Ajusta también el Site URL si aplica. Una página de GitHub Pages no debe recibir contraseñas ni claves de servicio en la URL.

### Credenciales que sí se pueden colocar en el frontend

En **Project Settings → API Keys / Connect**, copia solamente:
- **Project URL** (por ejemplo `https://<proyecto>.supabase.co`).
- **Publishable key** (prefijo `sb_publishable_`).

No copies nunca la **secret key** (prefijo `sb_secret_`), **service_role**, contraseña de la base de datos ni las claves de matrícula a archivos del repositorio o al navegador.

## 2. Conectar GitHub Pages

En GitHub, abre este repositorio → **Settings → Secrets and variables → Actions → Variables** y crea:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | URL de proyecto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública `sb_publishable_...` |

Estos valores son públicos por diseño; no son secretos administrativos. El flujo de GitHub Pages los inyecta **durante la compilación**. Sin esos dos valores, la aplicación muestra la demo existente, no el formulario de registro.

Tras integrar la rama a `main`, ve a **Actions → Publicar en GitHub Pages → Run workflow**. Comprueba que la compilación pasó y prueba el mismo enlace del hospital.

## 3. Convertir la primera cuenta en administradora

1. **Una vez activada la web y ejecutado el SQL**, crea tu propia cuenta desde el formulario y confirma su correo.
2. Abre SQL Editor en Supabase y ejecuta **sustituyendo el correo por el tuyo**:

```sql
update public.student_profiles
set role = 'admin'
where id = (
  select id from auth.users where lower(email) = lower('TU_CORREO_PERSONAL_O_INSTITUCIONAL')
);
```

3. Cierra sesión y vuelve a entrar. Verás el panel para crear cursos.

La asignación de roles nunca se hace desde la información enviada por el estudiante. No dar acceso al SQL Editor a estudiantes.

Para asignar la función docente, una persona autorizada puede usar una consulta similar sustituyendo `'admin'` por `'teacher'`, y el correo correspondiente.

## 4. Crear y abrir cada curso

1. Entra con cuenta administradora o docente autorizado.
2. Elige **Crear curso**, extensión (Chone, Tosagua o Pedernales), asignatura, nivel, paralelo y período.
3. El curso se crea inicialmente como **borrador**.
4. Genera una clave aleatoria individual (al menos 10 caracteres), guarda y distribúyela privadamente a tus estudiantes. Se almacena únicamente el verificador cifrado, no el texto de la clave.
5. El curso queda publicado cuando se configura su clave.
6. Para cambiar la clave, genera otra. **Las matrículas vigentes no se pierden**; la clave antigua deja de servir para nuevas inscripciones.
7. El estudiante crea su cuenta con nombre y correo, selecciona una extensión e introduce la clave de ese curso. Puede entrar a los materiales únicamente tras la confirmación del servidor.

**Importante:** cada instancia de curso tiene un ID y una clave propios. Por ejemplo, Morfofisiología de Pedernales A no comparte clave con Morfofisiología de Chone A.

La biblioteca de los 206 huesos se añade automáticamente al crear **Fundamentos de Morfofisiología** y se abre en su aula, no en Biología ni en el catálogo general. El progreso de estudio pasa a almacenarse por usuario y curso en la base de datos.

## 5. Verificaciones antes de invitar estudiantes reales

**No usar registros estudiantiles reales hasta superar estas comprobaciones:**

- Ejecutar SQL de migración sin errores y validar que todas las tablas públicas tienen RLS activo.
- Confirmar que la cuenta de prueba A (Pedernales) no ve cursos privados de Chone/Tosagua.
- Confirmar que un estudiante **sin matrícula** no puede consultar materiales ni insertar progreso desde API, aunque conozca el UUID.
- Confirmar que una clave incorrecta no matricula y que el límite de 5 intentos en 15 minutos funciona.
- Confirmar que una clave de un curso **no** matricula en otro.
- Confirmar que un estudiante no puede crear cursos, cambiar roles, modificar matrículas ni leer los verificadores de claves.
- Confirmar que el docente solo gestiona sus cursos, que el administrador puede gestionar los autorizados y que se elimina el acceso de estudiantes bloqueados.
- Probar recuperación de cuenta, confirmación de correo, uso en móvil y protección de datos personales.

Si una prueba falla, **mantener el portal de matrícula deshabilitado** hasta corregir las políticas.

## Limitaciones y privacidad

- GitHub Pages no tiene servidor. **Supabase** autentica y aplica autorizaciones; el frontend no debe decidir por sí solo quién está matriculado.
- La biblioteca está asignada exclusivamente al aula de Morfofisiología y su progreso se guarda con RLS; sin embargo, las **descripciones anatómicas generales ya incluidas en el paquete JavaScript no son contenido confidencial**. No se deben incluir exámenes reservados, respuestas secretas ni datos privados en el código frontend. Los futuros materiales verdaderamente privados deberán servirse desde el backend después de validar matrícula.
- Las sesiones usan almacenamiento de sesión del navegador y la autenticación por correo. La infraestructura, dominio, correo transaccional, límites de uso y políticas de privacidad deben verificarse antes de poner el servicio en producción.
- No afirmar aprobación institucional ni usar datos de pacientes reales. El sistema sigue siendo un **prototipo educativo** hasta cumplir las exigencias académicas, legales y de seguridad.
