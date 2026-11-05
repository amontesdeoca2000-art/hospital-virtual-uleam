import { useEffect, useState, type FormEvent } from 'react'
import { BookOpen, ClipboardCheck, Users, CheckCircle2 } from 'lucide-react'
import {
  type Course, type CourseAssignment, type CourseSubmission, type Session,
  type StudentRoster, getCourseAssignments, getAssignmentSubmissions, getCourseRoster,
  createCourseAssignment, submitCourseAssignment, gradeCourseSubmission, createCourseReading,
} from '../services/campusApi'
import './CourseWork.css'

const errorMessage = (e: unknown) => e instanceof Error ? e.message : 'Error de conexión.'
export function CourseWork({course, session, isStaff, onSession, onError, onNotice, onRefreshMaterials}: {
  course: Course
  session: Session
  isStaff: boolean
  onSession: (s:Session)=>void
  onError: (s:string)=>void
  onNotice: (s:string)=>void
  onRefreshMaterials: ()=>Promise<void>
}) {
  const [roster,setRoster]=useState<StudentRoster[]>([])
  const [assignments,setAssignments]=useState<CourseAssignment[]>([])
  const [submissions,setSubmissions]=useState<CourseSubmission[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [tab,setTab]=useState<'actividades'|'estudiantes'|'crear'>('actividades')
  const [kind,setKind]=useState<'actividad'|'evaluacion'>('actividad')
  const [title,setTitle]=useState('')
  const [instructions,setInstructions]=useState('')
  const [maxScore,setMaxScore]=useState('10')
  const [dueAt,setDueAt]=useState('')
  const [readingTitle,setReadingTitle]=useState('')
  const [readingText,setReadingText]=useState('')
  const [answers,setAnswers]=useState<Record<string,string>>({})
  const [grades,setGrades]=useState<Record<string,string>>({})
  const [feedback,setFeedback]=useState<Record<string,string>>({})
  const nameFor=(id:string)=>roster.find(s=>s.user_id===id)?.full_name||'Estudiante matriculado'
  async function reload() {
    const a=await getCourseAssignments(session,course.id)
    const [s,r]=await Promise.all([
      getAssignmentSubmissions(a.session,a.value.map(x=>x.id)),
      isStaff?getCourseRoster(a.session,course.id):Promise.resolve(null),
    ])
    setAssignments(a.value);setSubmissions(s.value);if(r)setRoster(r.value);onSession(s.session)
  }
  useEffect(()=>{
    let active=true
    const load=async()=>{
      setLoading(true)
      try{
        const a=await getCourseAssignments(session,course.id)
        const [s,r]=await Promise.all([
          getAssignmentSubmissions(a.session,a.value.map(x=>x.id)),
          isStaff?getCourseRoster(a.session,course.id):Promise.resolve(null),
        ])
        if(!active)return
        setAssignments(a.value);setSubmissions(s.value);if(r)setRoster(r.value);onSession(s.session)
      }catch(e){if(active)onError('No se pudo cargar el curso: '+errorMessage(e))}
      finally{if(active)setLoading(false)}
    }
    void load()
    return()=>{active=false}
    // Un cambio del token de sesión no debe recargar el aula repetidamente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[course.id,isStaff,session.user.id])
  async function perform(action:()=>Promise<void>,message:string){
    setBusy(true);onError('');onNotice('')
    try{await action();onNotice(message)}
    catch(e){onError(errorMessage(e))}
    finally{setBusy(false)}
  }
  function createAssignment(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!isStaff)return
    const value=Number(maxScore)
    if(!Number.isFinite(value)||value<=0||value>100){onError('Puntaje máximo entre 0,01 y 100.');return}
    void perform(async()=>{
      const r=await createCourseAssignment(session,{
        course_id:course.id,title:title.trim(),instructions:instructions.trim(),
        kind,max_score:value,due_at:dueAt?new Date(dueAt).toISOString():null,published:true,
      })
      onSession(r.session);await reload();setTitle('');setInstructions('');setDueAt('');setTab('actividades')
    },'Actividad publicada en este curso.')
  }
  function publishReading(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!isStaff)return
    void perform(async()=>{
      const r=await createCourseReading(session,course.id,readingTitle.trim(),readingText.trim())
      onSession(r.session);await onRefreshMaterials();setReadingTitle('');setReadingText('')
    },'Lectura publicada en este curso.')
  }
  function submitAnswer(a:CourseAssignment){
    const answer=(answers[a.id]||submissions.find(s=>s.assignment_id===a.id&&s.user_id===session.user.id)?.answer_text||'').trim()
    if(answer.length<10){onError('Escribe al menos 10 caracteres.');return}
    void perform(async()=>{
      const r=await submitCourseAssignment(session,a.id,answer)
      onSession(r.session);await reload()
    },'Respuesta entregada correctamente.')
  }
  function saveGrade(a:CourseAssignment,s:CourseSubmission){
    if(!isStaff)return
    const key=a.id+':'+s.user_id
    const raw=grades[key]??(s.score===null?'':String(s.score))
    if(raw.trim()===''||!Number.isFinite(Number(raw))||Number(raw)<0||Number(raw)>a.max_score){
      onError('La nota debe estar entre 0 y '+a.max_score);return
    }
    void perform(async()=>{
      const r=await gradeCourseSubmission(session,a.id,s.user_id,Number(raw),feedback[key]??s.feedback)
      onSession(r.session);await reload()
    },'Nota y retroalimentación guardadas.')
  }
  return <section className="coursework">
    <div className="coursework-heading"><div><p className="eyebrow">AULA ACADÉMICA · {course.extension}</p><h2>{isStaff?'Panel docente':'Actividades y calificaciones'}</h2>
      <p>{isStaff?'Estudiantes, avances, evaluaciones y notas de este curso.':'Entrega tus respuestas y consulta las notas asignadas por tu docente.'}</p></div>
      {isStaff&&<div className="coursework-counts"><span><Users size={16}/> {roster.filter(s=>s.status==='active').length} matriculados</span><span><ClipboardCheck size={16}/> {assignments.length} actividades</span></div>}
    </div>
    {loading?<p role="status">Cargando actividades…</p>:<>
      {isStaff&&<nav className="coursework-tabs" aria-label="Gestión del curso">
        <button className={tab==='actividades'?'selected':''} onClick={()=>setTab('actividades')}>Entregas y notas</button>
        <button className={tab==='estudiantes'?'selected':''} onClick={()=>setTab('estudiantes')}>Estudiantes y avances</button>
        <button className={tab==='crear'?'selected':''} onClick={()=>setTab('crear')}>Crear actividades</button>
      </nav>}
      {isStaff&&tab==='estudiantes'&&<div className="coursework-panel">
        <h3>Nómina de estudiantes</h3><p>Huesos marcados como estudiados; no equivale a una nota.</p>
        {!roster.length?<p>No hay estudiantes matriculados.</p>:<div className="coursework-scroll"><table>
          <thead><tr><th>Estudiante</th><th>Matrícula</th><th>Huesos estudiados</th><th>Progreso</th></tr></thead>
          <tbody>{roster.map(s=><tr key={s.user_id}>
            <td>{s.full_name}</td><td>{s.status==='active'?'Activa':'Bloqueada'}</td>
            <td>{course.subject_id==='fundamentos'?String(s.studied_count)+' / 206':'No aplica'}</td>
            <td>{course.subject_id==='fundamentos'?<progress max={206} value={s.studied_count} aria-label={'Avance de '+s.full_name}/>: '—'}</td>
          </tr>)}</tbody>
        </table></div>}
      </div>}
      {isStaff&&tab==='crear'&&<div className="coursework-form-grid">
        <form className="coursework-panel" onSubmit={createAssignment}>
          <h3><ClipboardCheck size={19}/> Nueva actividad o evaluación</h3>
          <label>Tipo<select value={kind} onChange={e=>setKind(e.target.value as 'actividad'|'evaluacion')}><option value="actividad">Actividad</option><option value="evaluacion">Evaluación con respuesta escrita</option></select></label>
          <label>Título<input required minLength={5} maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej. Taller de huesos"/></label>
          <label>Instrucciones<textarea required minLength={10} maxLength={8000} rows={5} value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Describe lo que debe responder el estudiante"/></label>
          <label>Puntaje máximo<input type="number" required min="0.01" max="100" step="0.01" value={maxScore} onChange={e=>setMaxScore(e.target.value)}/></label>
          <label>Fecha límite (opcional)<input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/></label>
          <small>Las respuestas se califican manualmente. El alumno no podrá ver otras entregas.</small>
          <button className="primary" type="submit" disabled={busy}>Publicar actividad</button>
        </form>
        <form className="coursework-panel" onSubmit={publishReading}>
          <h3><BookOpen size={19}/> Publicar lectura</h3>
          <label>Título<input required minLength={5} maxLength={160} value={readingTitle} onChange={e=>setReadingTitle(e.target.value)}/></label>
          <label>Contenido<textarea required minLength={10} maxLength={8000} rows={7} value={readingText} onChange={e=>setReadingText(e.target.value)}/></label>
          <button className="primary" type="submit" disabled={busy}>Publicar material</button>
        </form>
      </div>}
      {(!isStaff||tab==='actividades')&&<div className="coursework-list">
        <h3>Actividades y evaluaciones ({assignments.length})</h3>
        {!assignments.length&&<p className="coursework-empty">El docente todavía no ha publicado actividades.</p>}
        {assignments.map(a=>{
          const mine=submissions.find(s=>s.assignment_id===a.id&&s.user_id===session.user.id)
          const deliveries=submissions.filter(s=>s.assignment_id===a.id)
          const closed=a.due_at!==null&&new Date(a.due_at).getTime()<Date.now()
          return <article className="coursework-panel" key={a.id}>
            <div className="coursework-assignment-head"><div><small>{a.kind==='evaluacion'?'EVALUACIÓN':'ACTIVIDAD'}</small><h4>{a.title}</h4></div><strong>Máximo {a.max_score} puntos</strong></div>
            <p className="coursework-instructions">{a.instructions}</p>
            {a.due_at&&<p className="coursework-muted">Fecha límite: {new Date(a.due_at).toLocaleString('es-EC')}</p>}
            {isStaff?<>
              <p className="coursework-muted">{deliveries.length} entregas · {deliveries.filter(s=>s.graded_at).length} calificadas</p>
              {!deliveries.length&&<p>Sin respuestas todavía.</p>}
              {deliveries.map(s=>{
                const key=a.id+':'+s.user_id
                return <section key={key} className="coursework-delivery">
                  <strong>{nameFor(s.user_id)}</strong><small>{new Date(s.submitted_at).toLocaleString('es-EC')}</small>
                  <p className="coursework-instructions">{s.answer_text}</p>
                  <div className="coursework-grade-grid">
                    <label>Nota de {a.max_score}<input aria-label={'Nota para '+nameFor(s.user_id)} type="number" min="0" max={a.max_score} step="0.01" value={grades[key]??(s.score===null?'':String(s.score))} onChange={e=>setGrades(v=>({...v,[key]:e.target.value}))}/></label>
                    <label>Retroalimentación<textarea rows={2} maxLength={3000} value={feedback[key]??s.feedback} onChange={e=>setFeedback(v=>({...v,[key]:e.target.value}))}/></label>
                    <button type="button" className="primary" disabled={busy} onClick={()=>saveGrade(a,s)}>Guardar nota</button>
                  </div>
                </section>
              })}
            </>:<>
              {mine&&<div className="coursework-own"><CheckCircle2 size={17}/> Respuesta entregada · {mine.score===null?'Pendiente de calificar':String(mine.score)+' / '+a.max_score}
                {mine.feedback&&<p><strong>Retroalimentación:</strong> {mine.feedback}</p>}
              </div>}
              {closed?<p className="coursework-muted">El plazo de entrega terminó.</p>:mine?.graded_at?<p className="coursework-muted">Ya está calificada y no puede modificarse.</p>:<div className="coursework-student-form">
                <label>Tu respuesta<textarea rows={4} maxLength={8000} value={answers[a.id]??mine?.answer_text??''} onChange={e=>setAnswers(v=>({...v,[a.id]:e.target.value}))}/></label>
                <button type="button" className="primary" disabled={busy} onClick={()=>submitAnswer(a)}>{mine?'Actualizar respuesta':'Entregar respuesta'}</button>
              </div>}
            </>}
          </article>
        })}
      </div>}
    </>}
    <p className="coursework-disclaimer">Las calificaciones de este prototipo no se sincronizan con Moodle ni con el registro oficial de notas.</p>
  </section>
}
