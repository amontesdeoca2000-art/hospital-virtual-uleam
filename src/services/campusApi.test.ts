import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { Session } from './campusApi'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('VITE_SUPABASE_URL', 'https://aula.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_prueba_publica_segura_de_test')
  sessionStorage.clear()
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})
const reply = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
})

it('registra solo datos de perfil y nunca un rol elevado desde el navegador', async () => {
  const requests: Array<{url:string;init:RequestInit}> = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    requests.push({ url, init })
    return reply({ id: 'usuario-pendiente' })
  }))
  const api = await import('./campusApi')
  expect(api.campusBackendReady).toBe(true)
  const result = await api.signUp('  E@ULEAM.edu.ec ', 'contrasena-de-prueba', 'Estudiante Ficticio', 'Pedernales')
  expect(result.confirmed).toBe(false)
  expect(requests[0].url).toMatch(/\/auth\/v1\/signup$/)
  expect(JSON.parse(String(requests[0].init.body))).toEqual({
    email: 'e@uleam.edu.ec', password: 'contrasena-de-prueba',
    data: { full_name: 'Estudiante Ficticio', extension: 'Pedernales' },
  })
  expect(sessionStorage.length).toBe(0)
})

it('envía la matrícula exclusivamente a la función protegida del servidor', async () => {
  const req: Array<{ url: string; init: RequestInit }> = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    req.push({url,init})
    return reply({ok: true, message:'Matrícula registrada correctamente.'})
  }))
  const api = await import('./campusApi')
  const session: Session = {
    access_token: 'token-ficticio', refresh_token: 'refresco-ficticio',
    expires_at: Date.now() + 3600000, user: { id:'00000000-0000-0000-0000-000000000001' },
  }
  const result = await api.enroll(session, 'curso-ficticio', 'codigo-secreto-de-prueba')
  expect(result.value.ok).toBe(true)
  expect(req[0].url).toContain('/rpc/enroll_in_academic_course')
  expect((req[0].init.headers as Record<string,string>).Authorization).toBe('Bearer token-ficticio')
  expect(JSON.parse(String(req[0].init.body))).toEqual({
    p_course_id: 'curso-ficticio', p_code: 'codigo-secreto-de-prueba',
  })
  expect(sessionStorage.length).toBe(0)
})

it('no convierte en matrícula un rechazo del servidor por clave incorrecta', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => reply({
    ok: false, message: 'Clave de matrícula incorrecta.',
  })))
  const api = await import('./campusApi')
  const session: Session = {
    access_token:'falso',refresh_token:'falso',expires_at:Date.now()+1000000,
    user:{id:'00000000-0000-0000-0000-000000000001'},
  }
  const result=await api.enroll(session,'curso','clave-errada')
  expect(result.value.ok).toBe(false)
  expect(result.value.message).toContain('incorrecta')
})
