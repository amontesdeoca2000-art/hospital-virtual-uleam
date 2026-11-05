# Simulador clínico de Enfermería — Hospital Virtual ULEAM

**Alcance:** primera etapa interactiva de toma de decisiones, casos enteramente ficticios y evaluación formativa. No se representan pacientes ni solicitudes de exámenes reales.

## Flujo dentro de cada curso

**Docente:** iniciar sesión → entrar en el curso → **Crear actividades** → **Tipo: Simulación clínica interactiva** → elegir caso → ajustar título, instrucciones, puntaje y fecha límite → **Publicar actividad**.

**Estudiante matriculado:** abrir el aula → seleccionar la simulación → revisar la historia y signos vitales → responder las cinco etapas:
1. Prioridad y triaje.
2. Valoración focalizada de Enfermería.
3. Estudios complementarios pertinentes que se realizan o coordinan según protocolos y prescripción.
4. Cuidados y medidas prioritarias de Enfermería.
5. Reevaluación y entrega estructurada SBAR.

El sistema simula el informe de una prueba después de elegir el examen e ilustra un cambio de estado del paciente. Las opciones se mezclan para no presentar siempre la primera como correcta.

## Casos preparados

- `hipoglucemia-alerta`: paciente consciente con diabetes, síntomas agudos; glucometría, conducta según protocolo y recontrol.
- `dificultad-respiratoria`: disnea con SpO₂ baja; priorización respiratoria, valoración médica, vigilancia y coordinación de imágenes.
- `deshidratacion-perfusion`: vómitos/diarrea, presión baja y poca diuresis; balance, valoración de perfusión y coordinación de estudios.

## Calificaciones y seguridad

El servidor Supabase, no el navegador, verifica las cinco decisiones usando rúbricas en el esquema privado. El caso otorga máximo 5/5 decisiones; se transforma al puntaje máximo configurado (por defecto 10). Si la etapa de **prioridad** o la de **intervención** es insegura, el resultado se limita al 60 % del máximo aunque las demás sean correctas. Máximo **5 intentos** por estudiante y actividad. El docente puede consultar el historial por curso; el estudiante solo los propios.

Las tablas RLS no permiten que estudiantes inserten o alteren notas directamente, ni que anónimos vean resultados. La función de envío comprueba sesión, matrícula activa, fecha límite y límite de intentos. Las respuestas correctas de la rúbrica **no se exponen por la API pública**.

**Límite importante:** los textos de los casos y las opciones se distribuyen en el JavaScript del navegador. Por tanto, este módulo es una **práctica formativa supervisada**, no un examen de alta seguridad o una evaluación oficial a prueba de copia. Las notas son internas al prototipo y no se transfieren a Moodle.

## Soporte clínico conceptual

- American Diabetes Association, *Standards of Care in Diabetes 2026*, tratamiento de hipoglucemia: https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927/
- NICE NG250, neumonía (reconocimiento de gravedad, reevaluación y derivación): https://www.nice.org.uk/guidance/ng250/chapter/recommendations
- NICE CG174, terapia de líquidos intravenosos en hospital: https://www.nice.org.uk/guidance/cg174/chapter/recommendations

Los protocolos locales de Enfermería y las órdenes del equipo tratante tienen prioridad. No se emiten recetas, órdenes médicas reales ni recomendaciones terapéuticas para pacientes auténticos.

## Extensiones futuras

- Casos con varias ramas, eventos cronometrados, nueva valoración según respuestas y cambios fisiológicos simulados.
- Administración segura de fármacos con «5 correctos» y prescripción disponible en historia clínica ficticia.
- Hoja de cuidados e informes SBAR descargables, registro de valoración y evolución.
- Instrumentos formativos de seguridad del paciente, comunicación y adherencia a protocolos.
- Edición de escenarios por docentes con rúbricas validadas y versionadas.
- Contenido audiovisual/3D licenciado para formación, separado de la base de notas.
