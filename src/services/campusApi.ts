import { publicCampusUrl, publicCampusKey } from './publicCampusConfig'
/**
 * Cliente mínimo para Supabase Auth y PostgREST.
 * No almacena contraseñas ni códigos de matrícula.
 * La clave VITE_SUPABASE_PUBLISHABLE_KEY es pública; nunca usar service_role.
 * El servidor y sus reglas RLS son la autoridad de acceso.
 */
export type Campus = 'Pedernales' | 'Chone' | 'Tosagua'
export type Role = 'student' | 'teacher' | 'admin'
export type Profile = {
  id: string
  full_name: string
  extension: Campus
  role: Role
}
export type Course = {
  id: string
  extension: Campus
  career_id: 'enfermeria' | 'fisioterapia'
  subject_id: string
  title: string
  level_name: string
  parallel: string
  academic_term: string
  teacher_id: string | null
  published: boolean
}
export type Enrollment = {
  course_id: string
  status: 'active' | 'blocked'
}
export type Material = {
  id: string
  course_id: string
  kind: 'bone-library' | 'reading' | 'activity'
  title: string
  description: string
}
export type Session = {
  access_token: string
  refresh_token: string
  expires_at: number
  user: { id: string; email?: string }
}
export type CodeResponse = { ok: boolean; message: string }

const baseUrl = String(import.meta.env.VITE_SUPABASE_URL || publicCampusUrl).replace(/\/+$/, '')
const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || publicCampusKey)
const storageKey = 'hv-uleam:campus-session-v1'
export const campusBackendReady =
  /^https:\/\/[a-z0-9.-]+$/i.test(baseUrl) && publishableKey.length > 15
let pendingRefresh: Promise<Session> | null = null

function parseError(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const d = payload as Record<string, unknown>
    const msg = d.message || d.msg || d.error_description || d.error
    if (typeof msg === 'string' && msg) return msg
  }
  return 'No se pudo completar la solicitud. Comprueba tu conexión e inténtalo otra vez.'
}

async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  token?: string,
  prefer?: string,
): Promise<T> {
  if (!campusBackendReady) throw new Error('El servidor de matrículas aún no está configurado.')
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      apikey: publishableKey,
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const raw = await response.text()
  let data: unknown = null
  try { data = raw ? JSON.parse(raw) : null } catch { /* conservar error genérico */ }
  if (!response.ok) throw new Error(parseError(data))
  return data as T
}
function persist(session: Session | null) {
  try {
    if (session) sessionStorage.setItem(storageKey, JSON.stringify(session))
    else sessionStorage.removeItem(storageKey)
  } catch { /* Sin sesión persistente cuando el navegador bloquea el almacenamiento. */ }
}
function normalizeSession(data: unknown): Session {
  const d = data as Record<string, unknown>
  const u = d.user as Record<string, unknown> | undefined
  if (typeof d.access_token !== 'string' || typeof d.refresh_token !== 'string'
    || !u || typeof u.id !== 'string') {
    throw new Error('No se recibió una sesión válida. Revisa la confirmación de correo.')
  }
  return {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: Date.now() + Number(d.expires_in || 3600) * 1000,
    user: { id: u.id, email: typeof u.email === 'string' ? u.email : undefined },
  }
}
export function restoreSession(): Session | null {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(storageKey) || 'null')
    if (!parsed || typeof parsed !== 'object') return null
    const session = parsed as Session
    if (typeof session.access_token !== 'string' || typeof session.refresh_token !== 'string'
      || !session.user?.id || !Number.isFinite(session.expires_at)) return null
    return session
  } catch { return null }
}
export async function refreshSession(session: Session): Promise<Session> {
  if (session.expires_at - Date.now() > 60000) return session
  if (!pendingRefresh) {
    pendingRefresh = request<unknown>(
      '/auth/v1/token?grant_type=refresh_token',
      'POST',
      { refresh_token: session.refresh_token },
    ).then(normalizeSession).then((fresh) => {
      persist(fresh)
      return fresh
    }).catch((err) => {
      persist(null)
      throw err
    }).finally(() => { pendingRefresh = null })
  }
  return pendingRefresh
}
export async function signUp(
  email: string, password: string, fullName: string, extension: Campus,
): Promise<{ confirmed: boolean; session: Session | null }> {
  const data = await request<Record<string, unknown>>('/auth/v1/signup', 'POST', {
    email: email.trim().toLowerCase(),
    password,
    data: { full_name: fullName.trim(), extension },
  })
  if (data.access_token && data.refresh_token) {
    const session = normalizeSession(data)
    persist(session)
    return { confirmed: true, session }
  }
  // Confirmación por correo activada en Supabase: esperar al estudiante.
  return { confirmed: false, session: null }
}
export async function signIn(email: string, password: string): Promise<Session> {
  const result = await request<unknown>('/auth/v1/token?grant_type=password', 'POST', {
    email: email.trim().toLowerCase(), password,
  })
  const session = normalizeSession(result)
  persist(session)
  return session
}
export async function signOut(session: Session | null): Promise<void> {
  try {
    if (session) await request<unknown>('/auth/v1/logout', 'POST', {}, session.access_token)
  } finally {
    persist(null)
  }
}
async function withSession<T>(session: Session, path: string, method = 'GET', body?: unknown, prefer?: string):
  Promise<{ value: T; session: Session }> {
  const fresh = await refreshSession(session)
  const value = await request<T>(path, method, body, fresh.access_token, prefer)
  return { value, session: fresh }
}
export async function getProfile(session: Session) {
  const result = await withSession<Profile[]>(session,
    '/rest/v1/student_profiles?select=id,full_name,extension,role&id=eq.' + encodeURIComponent(session.user.id))
  return { value: result.value[0] || null, session: result.session }
}
export async function getCourses(session: Session) {
  return withSession<Course[]>(session,
    '/rest/v1/academic_courses?select=id,extension,career_id,subject_id,title,level_name,parallel,academic_term,teacher_id,published&order=title.asc')
}
export async function getEnrollments(session: Session) {
  return withSession<Enrollment[]>(session,
    '/rest/v1/course_enrollments?select=course_id,status&user_id=eq.' + encodeURIComponent(session.user.id))
}
export async function enroll(session: Session, courseId: string, code: string) {
  return withSession<CodeResponse>(session,
    '/rest/v1/rpc/enroll_in_academic_course',
    'POST', { p_course_id: courseId, p_code: code })
}
export async function setCourseCode(session: Session, courseId: string, code: string) {
  return withSession<boolean>(session,
    '/rest/v1/rpc/set_course_enrollment_code', 'POST', {
      p_course_id: courseId, p_code: code,
    })
}
export async function createCourse(session: Session, draft: Omit<Course, 'id' | 'published'>) {
  const result = await withSession<Course[]>(session, '/rest/v1/academic_courses',
    'POST', { ...draft, published: false }, 'return=representation')
  if (!result.value[0]) throw new Error('No se confirmó la creación del curso.')
  return { value: result.value[0], session: result.session }
}
export async function publishCourse(session: Session, courseId: string) {
  return withSession<unknown>(session, '/rest/v1/academic_courses?id=eq.' + encodeURIComponent(courseId),
    'PATCH', { published: true })
}
export async function addMaterial(session: Session, courseId: string, kind: Material['kind'], title: string) {
  return withSession<unknown>(session, '/rest/v1/course_materials', 'POST', {
    course_id: courseId, kind, title, description: '',
  })
}
export async function getMaterials(session: Session, courseId: string) {
  return withSession<Material[]>(session,
    '/rest/v1/course_materials?select=id,course_id,kind,title,description&published=eq.true&course_id=eq.' + encodeURIComponent(courseId))
}
export async function getBoneProgress(session: Session, courseId: string) {
  return withSession<{ bone_id: string }[]>(session,
    '/rest/v1/bone_study_progress?select=bone_id&user_id=eq.' + encodeURIComponent(session.user.id)
    + '&course_id=eq.' + encodeURIComponent(courseId))
}
export async function saveBoneProgress(session: Session, courseId: string, boneId: string, studied: boolean) {
  if (studied) {
    return withSession<unknown>(session, '/rest/v1/bone_study_progress', 'POST', {
      user_id: session.user.id, course_id: courseId, bone_id: boneId,
    }, 'resolution=ignore-duplicates')
  }
  return withSession<unknown>(session,
    '/rest/v1/bone_study_progress?user_id=eq.' + encodeURIComponent(session.user.id)
    + '&course_id=eq.' + encodeURIComponent(courseId) + '&bone_id=eq.' + encodeURIComponent(boneId),
    'DELETE')
}


export type CourseAssignment = {
  id: string
  course_id: string
  title: string
  instructions: string
  kind: 'actividad' | 'evaluacion'
  max_score: number
  due_at: string | null
  published: boolean
  created_at: string
}
export type StudentRoster = {
  user_id: string
  full_name: string
  enrolled_at: string
  studied_count: number
  status: 'active' | 'blocked'
}
export type CourseSubmission = {
  assignment_id: string
  user_id: string
  answer_text: string
  submitted_at: string
  score: number | null
  feedback: string
  graded_at: string | null
}

export function getCourseAssignments(session: Session, courseId: string) {
  return withSession<CourseAssignment[]>(session,
    '/rest/v1/course_assignments?select=id,course_id,title,instructions,kind,max_score,due_at,published,created_at&course_id=eq.'
    + encodeURIComponent(courseId) + '&order=created_at.desc')
}
export function createCourseAssignment(
  session: Session,
  draft: Omit<CourseAssignment, 'id' | 'created_at'>,
) {
  return withSession<CourseAssignment[]>(session,'/rest/v1/course_assignments',
    'POST',draft,'return=representation')
}
export function getCourseRoster(session: Session, courseId: string) {
  return withSession<StudentRoster[]>(session,'/rest/v1/rpc/get_course_roster',
    'POST',{p_course_id:courseId})
}
export function getAssignmentSubmissions(session: Session, assignmentIds: string[]) {
  if (!assignmentIds.length) return Promise.resolve({value:[] as CourseSubmission[],session})
  const ids = assignmentIds.map(encodeURIComponent).join(',')
  return withSession<CourseSubmission[]>(session,
    '/rest/v1/assignment_submissions?select=assignment_id,user_id,answer_text,submitted_at,score,feedback,graded_at'
    + '&assignment_id=in.(' + ids + ')&order=submitted_at.desc')
}
export function submitCourseAssignment(session: Session, assignmentId: string, answer: string) {
  return withSession<CodeResponse>(session,'/rest/v1/rpc/submit_course_assignment',
    'POST',{p_assignment_id:assignmentId,p_answer:answer})
}
export function gradeCourseSubmission(
  session: Session, assignmentId: string, studentId: string, score: number, feedback: string,
) {
  return withSession<boolean>(session,'/rest/v1/rpc/grade_course_submission',
    'POST',{p_assignment_id:assignmentId,p_student_id:studentId,p_score:score,p_feedback:feedback})
}
export function createCourseReading(
  session: Session, courseId: string, title: string, description: string,
) {
  return withSession<unknown>(session,'/rest/v1/course_materials','POST',{
    course_id:courseId,title,description,kind:'reading',published:true,
  })
}
