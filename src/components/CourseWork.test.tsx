import { afterEach, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CourseWork } from './CourseWork'
import type { Course, Session } from '../services/campusApi'

const course: Course = {
  id:'00000000-0000-4000-8000-000000000001',
  extension:'Pedernales',career_id:'enfermeria',subject_id:'fundamentos',
  title:'Morfofisiología Básica',level_name:'Primero',parallel:'A',academic_term:'2026-2',
  teacher_id:'00000000-0000-4000-8000-000000000003',published:true,
}
const studentId='00000000-0000-4000-8000-000000000002'
const session: Session = {
  user:{id:studentId},access_token:'demo',refresh_token:'refresh',expires_at:Date.now()+100000,
}
const fake = vi.hoisted(()=>({
  getCourseAssignments:vi.fn(),getAssignmentSubmissions:vi.fn(),getCourseRoster:vi.fn(),
  getSimulationAttempts:vi.fn(),
  createCourseAssignment:vi.fn(),createCourseReading:vi.fn(),
  submitCourseAssignment:vi.fn(),gradeCourseSubmission:vi.fn(),
}))
vi.mock('../services/campusApi',()=>({...fake}))
afterEach(()=>vi.clearAllMocks())
fake.getSimulationAttempts.mockResolvedValue({session,value:[]})

function mount(staff: boolean) {
  const onError=vi.fn(),onSession=vi.fn(),onNotice=vi.fn()
  render(<CourseWork course={course} session={session} isStaff={staff}
    onSession={onSession} onError={onError} onNotice={onNotice}
    onRefreshMaterials={vi.fn(async()=>{})}/>)
  return {onError,onSession,onNotice}
}
it('muestra matrícula y avance solo a docente autorizado',async()=>{
  fake.getCourseAssignments.mockResolvedValue({session,value:[]})
  fake.getAssignmentSubmissions.mockResolvedValue({session,value:[]})
  fake.getCourseRoster.mockResolvedValue({session,value:[
    {user_id:studentId,full_name:'Estudiante de prueba',enrolled_at:'2026-11-05',studied_count:19,status:'active'},
  ]})
  const user=userEvent.setup()
  mount(true)
  await user.click(await screen.findByRole('button',{name:'Estudiantes y avances'}))
  expect(await screen.findByText('Estudiante de prueba')).toBeInTheDocument()
  expect(screen.getByText('19 / 206')).toBeInTheDocument()
  expect(screen.getByText('1 matriculados')).toBeInTheDocument()
})

it('oculta nómina, creación y calificación al estudiante',async()=>{
  fake.getCourseAssignments.mockResolvedValue({session,value:[{
    id:'actividad-1',course_id:course.id,title:'Taller de huesos',
    instructions:'Explique una función del esqueleto axial.',
    kind:'actividad',max_score:10,due_at:null,published:true,created_at:'2026-11-05',
  }]})
  fake.getAssignmentSubmissions.mockResolvedValue({session,value:[]})
  fake.getCourseRoster.mockResolvedValue({session,value:[]})
  const user=userEvent.setup()
  mount(false)
  expect(await screen.findByText('Taller de huesos')).toBeInTheDocument()
  expect(screen.queryByText('Estudiantes y avances')).not.toBeInTheDocument()
  expect(screen.queryByText('Crear actividades')).not.toBeInTheDocument()
  await user.type(screen.getByLabelText('Tu respuesta'),'El esqueleto axial protege el sistema nervioso central.')
  await user.click(screen.getByRole('button',{name:'Entregar respuesta'}))
  await waitFor(()=>expect(fake.submitCourseAssignment).toHaveBeenCalledWith(
    session,'actividad-1','El esqueleto axial protege el sistema nervioso central.'))
})
