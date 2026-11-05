import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Building2, GraduationCap, LockKeyhole, ShieldCheck, Users } from 'lucide-react'
import type { Subject } from '../model'
import './CourseDirectory.css'

export const extensions = ['Chone', 'Tosagua', 'Pedernales'] as const
export type Extension = typeof extensions[number]
export type CoursePreview = {
  extension: Extension
  careerId: string
  subjectId: string
}
type Course = { id: string; subjectId: string; careerId: string; level: string; title: string }
const demoCourses: Course[] = [
  { id: 'enf-morfo', subjectId: 'fundamentos', careerId: 'enfermeria', level: 'Primer semestre', title: 'Fundamentos de Morfofisiología' },
  { id: 'enf-bio', subjectId: 'bio-enf', careerId: 'enfermeria', level: 'Primer semestre', title: 'Biología' },
  { id: 'fisio-bio', subjectId: 'bio-fisio', careerId: 'fisioterapia', level: 'Tercer nivel', title: 'Biología' },
  { id: 'fisio-practica', subjectId: 'practicas', careerId: 'fisioterapia', level: 'Prácticas complementarias', title: 'Simulaciones y prácticas' },
]
export function CourseDirectory({
  subjects,
  onEnter,
}: {
  subjects: Subject[]
  onEnter: (selection: CoursePreview) => void
}) {
  const [extension, setExtension] = useState<Extension>('Pedernales')
  const [career, setCareer] = useState('todas')
  const choices = useMemo(() => demoCourses.filter((course) =>
    (career === 'todas' || course.careerId === career) &&
    subjects.some((s) => s.id === course.subjectId && s.careerId === course.careerId)
  ), [career, subjects])
  const extraSubjects = subjects
    .filter((s) => Boolean(s.careerId) && !demoCourses.some((course) => course.subjectId === s.id))
    .filter((s) => career === 'todas' || s.careerId === career)
    .map((s) => ({ id: s.id, subjectId: s.id, careerId: s.careerId, level: 'Nivel por definir', title: s.name }))
  const available = [...choices, ...extraSubjects]
  return (
    <div className="course-directory">
      <section className="course-intro">
        <p className="eyebrow">HOSPITAL VIRTUAL ULEAM · CAMPUS ACADÉMICO</p>
        <h2>Encuentra tu espacio de aprendizaje</h2>
        <p>Primero elige tu extensión y carrera. Después podrás entrar al contenido de tu asignatura. Esta es una vista de demostración: la matrícula y las cuentas personales se habilitarán cuando conectemos el sistema seguro de usuarios.</p>
      </section>
      <section aria-label="Seleccionar extensión">
        <div className="section-heading"><h2>1. Selecciona tu extensión</h2></div>
        <div className="course-campus-grid">
          {extensions.map((place) => (
            <button key={place} type="button" className={'course-campus ' + (extension === place ? 'selected' : '')}
              onClick={() => setExtension(place)} aria-pressed={extension === place}>
              <Building2 size={25} />
              <span><small>EXTENSIÓN</small><strong>{place}</strong></span>
              <span className="course-selected-indicator">{extension === place ? 'Seleccionada' : 'Elegir'}</span>
            </button>
          ))}
        </div>
      </section>
      <section aria-label="Seleccionar carrera">
        <div className="section-heading"><h2>2. Selecciona tu carrera</h2></div>
        <div className="course-career-buttons">
          {[
            { id: 'todas', name: 'Todas las carreras' },
            { id: 'enfermeria', name: 'Enfermería' },
            { id: 'fisioterapia', name: 'Fisioterapia' },
          ].map((c) => (
            <button key={c.id} type="button" aria-pressed={career === c.id}
              className={'course-career ' + (career === c.id ? 'selected' : '')}
              onClick={() => setCareer(c.id)}><GraduationCap size={17} />{c.name}</button>
          ))}
        </div>
      </section>
      <section>
        <div className="section-heading"><div><p className="eyebrow">VISTA ACADÉMICA DE DEMOSTRACIÓN</p><h2>3. Cursos disponibles para explorar · {extension}</h2></div><span className="badge">{available.length} asignaturas</span></div>
        <p className="course-disclaimer">Estos cursos son ejemplos iniciales para organizar el prototipo. Todavía no representan la oferta o las matrículas oficiales de la extensión {extension}.</p>
        <div className="course-card-grid">
          {available.map((course) => (
            <article key={course.id} className="course-class-card">
              <div className="course-class-icon"><BookOpen size={23} /></div>
              <p className="eyebrow">{extension.toUpperCase()} · {course.careerId === 'enfermeria' ? 'ENFERMERÍA' : 'FISIOTERAPIA'}</p>
              <h3>{course.title}</h3>
              <p>{course.level}</p>
              <button type="button" className="text-button" onClick={() => onEnter({ extension, careerId: course.careerId, subjectId: course.subjectId })}>
                Explorar contenido <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
        {available.length === 0 && <p className="empty">Todavía no hay asignaturas de esta carrera configuradas en la demostración.</p>}
      </section>
      <section className="course-future">
        <LockKeyhole size={27} />
        <div>
          <h2>Próximo paso: creación de cuentas y matrícula segura</h2>
          <p>El formulario real solicitará nombres y apellidos, correo institucional, extensión y curso. Cada estudiante creará su propia contraseña y usará un código de matrícula autorizado por el docente. La inscripción, los permisos y las notas se guardarán en un servidor protegido, no en este navegador.</p>
          <div className="course-future-points"><span><Users size={15} /> Cada estudiante, sus cursos</span><span><ShieldCheck size={15} /> Accesos gestionados por docentes</span></div>
        </div>
      </section>
    </div>
  )
}
