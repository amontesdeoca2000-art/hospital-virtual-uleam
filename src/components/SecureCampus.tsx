import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, Building2, CheckCircle2, GraduationCap,
  KeyRound, LockKeyhole, LogOut, Plus, RefreshCw, ShieldCheck, UserRound,
} from 'lucide-react'
import { BoneLibrary } from './BoneLibrary'
import {
  type Campus, type Course, type Enrollment, type Material, type Profile, type Session,
  addMaterial, createCourse, enroll, getBoneProgress, getCourses, getEnrollments,
  getMaterials, getProfile, publishCourse, refreshSession, restoreSession,
  saveBoneProgress, setCourseCode, signIn, signOut, signUp,
} from '../services/campusApi'
import './SecureCampus.css'

const campuses: Campus[] = ['Pedernales', 'Chone', 'Tosagua']
const subjects = [
  { id: 'fundamentos', career: 'enfermeria', title: 'Fundamentos de Morfofisiología (Morfofisiología Básica)' },
  { id: 'bio-enf', career: 'enfermeria', title: 'Biología de Enfermería' },
  { id: 'bio-fisio', career: 'fisioterapia', title: 'Biología de Fisioterapia' },
  { id: 'practicas', career: 'fisioterapia', title: 'Simulaciones y prácticas' },
] as const
const careerName = (career: string) => career === 'enfermeria' ? 'Enfermería' : 'Fisioterapia'
const messageOf = (reason: unknown) =>
  reason instanceof Error ? reason.message : 'Se produjo un error al conectar. Intenta nuevamente.'
function createRandomCode() {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

export function SecureCampus() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registrationCampus, setRegistrationCampus] = useState<Campus>('Pedernales')
  const [enrollmentInputs, setEnrollmentInputs] = useState<Record<string, string>>({})
  const [openedCourseId, setOpenedCourseId] = useState('')
  const [materials, setMaterials] = useState<Material[]>([])
  const [remoteProgress, setRemoteProgress] = useState<string[]>([])
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [newExtension, setNewExtension] = useState<Campus>('Pedernales')
  const [newSubject, setNewSubject] = useState('fundamentos')
  const [newLevel, setNewLevel] = useState('Primer semestre')
  const [newParallel, setNewParallel] = useState('A')
  const [newTerm, setNewTerm] = useState('2026-2')
  const [codeForCourse, setCodeForCourse] = useState<Record<string, string>>({})

  async function loadWorkspace(auth: Session) {
    const [p, c, e] = await Promise.all([
      getProfile(auth), getCourses(auth), getEnrollments(auth),
    ])
    setProfile(p.value)
    setCourses(c.value)
    setEnrollments(e.value)
    setSession(p.session)
  }
  useEffect(() => {
    let active = true
    async function boot() {
      const stored = restoreSession()
      if (!stored) { if (active) setLoading(false); return }
      try {
        const auth = await refreshSession(stored)
        if (active) await loadWorkspace(auth)
      } catch (reason) {
        if (active) setError('La sesión ha caducado. Vuelve a iniciar sesión. ' + messageOf(reason))
      } finally { if (active) setLoading(false) }
    }
    void boot()
    return () => { active = false }
  }, [])

  const isStaff = profile?.role === 'admin' || profile?.role === 'teacher'
  const visibleCourses = useMemo(() => courses.filter((course) =>
    isStaff
      ? profile?.role === 'admin' || course.teacher_id === profile?.id
      : course.published && course.extension === profile?.extension,
  ), [courses, isStaff, profile])
  const enrolled = (id: string) =>
    enrollments.some((item) => item.course_id === id && item.status === 'active')
  const managed = (course: Course) =>
    Boolean(isStaff && (profile?.role === 'admin' || course.teacher_id === profile?.id))
  const openedCourse = courses.find((c) => c.id === openedCourseId)
  const mayOpen = Boolean(openedCourse && (enrolled(openedCourse.id) || managed(openedCourse)))

  function resetMessages() { setNotice(''); setError('') }
  async function submitAuthentication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetMessages()
    if (mode === 'register' && (fullName.trim().length < 4 || password.length < 8)) {
      setError('Completa nombres y apellidos y una contraseña de al menos 8 caracteres.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'register') {
        const result = await signUp(email, password, fullName, registrationCampus)
        setPassword('')
        if (result.session) await loadWorkspace(result.session)
        else { setMode('login'); setNotice('Cuenta solicitada. Confirma tu correo electrónico y luego inicia sesión.') }
      } else {
        const auth = await signIn(email, password)
        setPassword('')
        await loadWorkspace(auth)
      }
    } catch (reason) { setError(messageOf(reason)) }
    finally { setBusy(false) }
  }
  async function doLogout() {
    resetMessages()
    try { await signOut(session) }
    catch { /* cerramos localmente incluso cuando el servidor no responde */ }
    setSession(null); setProfile(null); setCourses([]); setEnrollments([])
    setOpenedCourseId(''); setMaterials([]); setPassword('')
  }
  async function doEnroll(courseId: string) {
    if (!session || !enrollmentInputs[courseId]?.trim()) return
    setBusy(true); resetMessages()
    try {
      const result = await enroll(session, courseId, enrollmentInputs[courseId].trim())
      setSession(result.session)
      if (!result.value.ok) setError(result.value.message)
      else {
        setNotice(result.value.message)
        setEnrollmentInputs((current) => ({ ...current, [courseId]: '' }))
        const refreshed = await getEnrollments(result.session)
        setEnrollments(refreshed.value)
        setSession(refreshed.session)
      }
    } catch (reason) { setError(messageOf(reason)) }
    finally { setBusy(false) }
  }
  async function openCourse(course: Course) {
    if (!session || !(enrolled(course.id) || managed(course))) return
    resetMessages(); setBusy(true)
    try {
      const m = await getMaterials(session, course.id)
      setMaterials(m.value)
      setSession(m.session)
      if (course.subject_id === 'fundamentos') {
        const progress = await getBoneProgress(m.session, course.id)
        setRemoteProgress(progress.value.map((r) => r.bone_id))
        setSession(progress.session)
      } else setRemoteProgress([])
      setOpenedCourseId(course.id)
    } catch (reason) { setError(messageOf(reason)) }
    finally { setBusy(false) }
  }
  async function updateBone(id: string, shouldStudy: boolean) {
    if (!session || !openedCourse || !mayOpen) return
    resetMessages()
    try {
      const updated = await saveBoneProgress(session, openedCourse.id, id, shouldStudy)
      setSession(updated.session)
      setRemoteProgress((before) => shouldStudy
        ? Array.from(new Set([...before, id]))
        : before.filter((x) => x !== id))
    } catch (reason) { setError('No se pudo guardar el progreso: ' + messageOf(reason)) }
  }
  async function createNewCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !profile || !isStaff) return
    setBusy(true); resetMessages()
    try {
      const subject = subjects.find((s) => s.id === newSubject)
      if (!subject) throw new Error('Asigna una materia válida.')
      const response = await createCourse(session, {
        extension: newExtension, career_id: subject.career,
        subject_id: subject.id, title: subject.title,
        level_name: newLevel.trim(), parallel: newParallel.trim().toUpperCase(),
        academic_term: newTerm.trim(), teacher_id: profile.id,
      })
      if (subject.id === 'fundamentos') {
        await addMaterial(response.session, response.value.id, 'bone-library', 'Biblioteca de los 206 huesos')
      }
      const refreshed = await getCourses(response.session)
      setSession(refreshed.session)
      setCourses(refreshed.value)
      setShowCreateCourse(false)
      setNotice('Curso creado como borrador. Configura su clave de matrícula y publícalo.')
    } catch (reason) { setError(messageOf(reason)) }
    finally { setBusy(false) }
  }
  async function configureCode(course: Course) {
    if (!session || !managed(course) || !codeForCourse[course.id] || codeForCourse[course.id].length < 10) {
      setError('Escribe o genera una clave de al menos 10 caracteres.'); return
    }
    setBusy(true); resetMessages()
    try {
      const response = await setCourseCode(session, course.id, codeForCourse[course.id])
      setSession(response.session)
      setCodeForCourse((before) => ({...before, [course.id]: ''}))
      if (!course.published) {
        const published = await publishCourse(response.session, course.id)
        setSession(published.session)
        const refreshed = await getCourses(published.session)
        setCourses(refreshed.value)
        setSession(refreshed.session)
      }
      setNotice('Clave guardada en el servidor. Compártela por un canal privado con tus estudiantes. La anterior deja de servir para matrículas nuevas.')
    } catch (reason) { setError(messageOf(reason)) }
    finally { setBusy(false) }
  }
  return (
    <div className="secure-shell">
      <header className="secure-header">
        <div className="secure-brand"><div className="secure-brand-icon"><Building2 size={25}/></div>
          <span><strong>HOSPITAL VIRTUAL ULEAM</strong><small>Campus académico · acceso por curso</small></span>
        </div>
        {profile && <div className="secure-header-user">
          <span><UserRound size={16}/>{profile.full_name} · {profile.extension}</span>
          <button type="button" className="secondary" onClick={() => void doLogout()}><LogOut size={15}/> Salir</button>
        </div>}
      </header>
      <main className="secure-main">
        {loading ? <div className="secure-loading" role="status">Verificando tu sesión…</div> : (
          <>
            {error && <p className="secure-alert error" role="alert">{error}</p>}
            {notice && <p className="secure-alert success" role="status">{notice}</p>}
            {!session ? (
              <div className="secure-auth-layout">
                <div className="secure-auth-intro">
                  <p className="eyebrow">BIENVENIDO A TU CAMPUS</p>
                  <h1>Aprende en tu curso. Avanza a tu ritmo.</h1>
                  <p>Un espacio académico para estudiantes de Pedernales, Chone y Tosagua. Tu contraseña personal es distinta de la clave que entrega el docente para cada asignatura.</p>
                  <div className="secure-auth-feature"><ShieldCheck size={20}/> Matrículas y contenidos protegidos por permisos del servidor.</div>
                </div>
                <form className="secure-auth-form" onSubmit={(e) => void submitAuthentication(e)}>
                  <div className="secure-mode">
                    <button type="button" className={mode==='login'?'active':''} onClick={()=>{setMode('login');resetMessages()}}>Ingresar</button>
                    <button type="button" className={mode==='register'?'active':''} onClick={()=>{setMode('register');resetMessages()}}>Crear cuenta</button>
                  </div>
                  <h2>{mode === 'login' ? 'Iniciar sesión' : 'Registro de estudiante'}</h2>
                  {mode === 'register' && <>
                    <label>Nombres y apellidos<input required minLength={4} maxLength={160} autoComplete="name" value={fullName} onChange={(e)=>setFullName(e.target.value)} placeholder="Nombres y apellidos completos"/></label>
                    <label>Extensión<select value={registrationCampus} onChange={(e)=>setRegistrationCampus(e.target.value as Campus)}>
                      {campuses.map((c)=><option key={c}>{c}</option>)}
                    </select></label>
                  </>}
                  <label>Correo electrónico<input required type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="usuario@correo.com"/></label>
                  <label>Contraseña personal<input required type="password" minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={(e)=>setPassword(e.target.value)}/></label>
                  <button type="submit" className="primary" disabled={busy}>{busy?'Procesando…':mode==='login'?'Entrar al campus':'Crear mi cuenta'}<ArrowRight size={17}/></button>
                  <p className="secure-fineprint">No compartas tu contraseña. La clave de cada curso se solicitará después de iniciar sesión.</p>
                </form>
              </div>
            ) : !profile ? (
              <section className="panel"><h2>El perfil aún no está disponible</h2>
                <p>Comprueba que el esquema de base de datos se instaló correctamente. No se puede matricular sin perfil.</p>
                <button className="secondary" onClick={()=>void doLogout()}>Volver al inicio</button>
              </section>
            ) : openedCourse && mayOpen ? (
              <div className="secure-classroom">
                <button className="text-button" onClick={()=>setOpenedCourseId('')}><ArrowLeft size={16}/> Volver a mis cursos</button>
                <section className="secure-classroom-head">
                  <p className="eyebrow">{openedCourse.extension} · {careerName(openedCourse.career_id)} · {openedCourse.level_name}</p>
                  <h1>{openedCourse.title}</h1>
                  <p>Paralelo {openedCourse.parallel} · Período {openedCourse.academic_term}</p>
                </section>
                {materials.length === 0 ? (
                  <div className="empty"><BookOpen size={28}/><h3>El docente todavía no ha publicado materiales.</h3></div>
                ) : materials.map((material) => (
                  <section key={material.id}>
                    {material.kind === 'bone-library' && openedCourse.subject_id === 'fundamentos'
                      ? <BoneLibrary courseId={openedCourse.id} enrolledStudied={remoteProgress} onToggleStudied={updateBone}/>
                      : <article className="panel"><h2>{material.title}</h2><p>{material.description || 'Material académico del curso.'}</p></article>}
                  </section>
                ))}
              </div>
            ) : (
              <div className="secure-dashboard">
                <section className="secure-welcome">
                  <div><p className="eyebrow">{isStaff?'PANEL DOCENTE':'MI CAMPUS ACADÉMICO'} · {profile.extension}</p>
                    <h1>¡Hola, {profile.full_name.split(' ')[0]}!</h1>
                    <p>{isStaff?'Crea cursos, configura una clave distinta por curso y revisa las matrículas.':'Busca tu asignatura e ingresa la clave que te entregó su docente para matricularte.'}</p>
                  </div>
                  {isStaff && <button className="primary" onClick={()=>setShowCreateCourse(!showCreateCourse)}><Plus size={16}/> Crear curso</button>}
                </section>
                {isStaff && showCreateCourse && (
                  <form className="secure-new-course" onSubmit={(e)=>void createNewCourse(e)}>
                    <h2>Nuevo curso por extensión</h2>
                    <div className="secure-form-grid">
                      <label>Extensión<select value={newExtension} onChange={(e)=>setNewExtension(e.target.value as Campus)}>{campuses.map(c=><option key={c}>{c}</option>)}</select></label>
                      <label>Asignatura<select value={newSubject} onChange={(e)=>setNewSubject(e.target.value)}>{subjects.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
                      <label>Nivel<input required value={newLevel} onChange={e=>setNewLevel(e.target.value)}/></label>
                      <label>Paralelo<input required maxLength={10} value={newParallel} onChange={e=>setNewParallel(e.target.value)}/></label>
                      <label>Período académico<input required value={newTerm} onChange={e=>setNewTerm(e.target.value)}/></label>
                    </div>
                    <p>Primero se crea como borrador. Se publicará cuando configures su clave de matrícula.</p>
                    <button className="primary" disabled={busy} type="submit"><Plus size={16}/> Guardar curso</button>
                  </form>
                )}
                <section>
                  <div className="section-heading"><div><p className="eyebrow">{isStaff?'MIS AULAS':'OFERTA DE MI EXTENSIÓN'}</p><h2>Cursos disponibles</h2></div><span className="badge">{visibleCourses.length} cursos</span></div>
                  {!visibleCourses.length && <div className="empty"><GraduationCap size={29}/><h3>Todavía no hay cursos configurados.</h3><p>{isStaff?'Crea un curso y asigna su clave de matrícula.':'Tu docente debe publicar primero la asignatura de tu extensión.'}</p></div>}
                  <div className="secure-course-grid">
                    {visibleCourses.map((course)=>(
                      <article className="secure-course-card" key={course.id}>
                        <p className="eyebrow">{course.extension} · {careerName(course.career_id)}</p>
                        <h3>{course.title}</h3>
                        <p>{course.level_name} · Paralelo {course.parallel} · {course.academic_term}</p>
                        {managed(course) ? (
                          <div className="secure-join">
                            <span className="secure-status"><KeyRound size={15}/>{course.published?'Publicado':'Borrador'}</span>
                            <label>Configurar o cambiar la clave de este curso
                              <input autoComplete="off" type="text" minLength={10} maxLength={64}
                                value={codeForCourse[course.id]||''}
                                onChange={e=>setCodeForCourse(before=>({...before,[course.id]:e.target.value}))}
                                placeholder="Clave de al menos 10 caracteres"/>
                            </label>
                            <div className="secure-code-actions">
                              <button type="button" className="secondary" onClick={()=>setCodeForCourse(before=>({...before,[course.id]:createRandomCode()}))}><RefreshCw size={14}/> Generar clave</button>
                              <button type="button" disabled={busy} className="primary" onClick={()=>void configureCode(course)}>Guardar clave</button>
                            </div>
                            <small>Solo tú y quienes reciban la clave podrán usarla para matricularse. No la publiques.</small>
                            <button className="text-button" onClick={()=>void openCourse(course)}>Abrir aula <ArrowRight size={15}/></button>
                          </div>
                        ) : enrolled(course.id) ? (
                          <div className="secure-enrolled"><CheckCircle2 size={17}/> Matriculado
                            <button className="primary" onClick={()=>void openCourse(course)}>Entrar a mi aula <ArrowRight size={15}/></button>
                          </div>
                        ) : (
                          <form className="secure-join" onSubmit={e=>{e.preventDefault();void doEnroll(course.id)}}>
                            <label>Clave de matrícula de este curso
                              <input type="password" required autoComplete="off" value={enrollmentInputs[course.id]||''}
                                onChange={e=>setEnrollmentInputs(before=>({...before,[course.id]:e.target.value}))}
                                placeholder="Clave entregada por tu docente"/>
                            </label>
                            <button className="primary" type="submit" disabled={busy}><LockKeyhole size={15}/> Matricularme</button>
                          </form>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
                <div className="secure-privacy"><ShieldCheck size={22}/>
                  <p>La matrícula, las claves y los permisos se validan en el servidor. Las claves de cada curso no se incluyen en el código público de GitHub. No almacenes información clínica real.</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="secure-footer">Hospital Virtual ULEAM · Prototipo educativo. No es un sistema institucional oficialmente aprobado.</footer>
    </div>
  )
}
