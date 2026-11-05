import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClinicalSimulator } from './ClinicalSimulator'
import { clinicalCases } from '../data/clinicalScenarios'
import type { CourseAssignment, Session } from '../services/campusApi'

const stub=vi.hoisted(()=>({
  submitSimulationAttempt:vi.fn(),
}))
vi.mock('../services/campusApi',()=>({...stub}))

const auth:Session={
  access_token:'falso-educativo',refresh_token:'refresco-falso',
  expires_at:Date.now()+3600000,user:{id:'00000000-0000-4000-8000-000000000002'},
}
const assignment:CourseAssignment={
  id:'00000000-0000-4000-8000-000000000003',
  course_id:'00000000-0000-4000-8000-000000000001',
  title:'Simulación: hipoglucemia',kind:'simulacion',scenario_id:'hipoglucemia-alerta',
  instructions:'Realiza las cinco decisiones clínicas.',
  max_score:10,due_at:null,published:true,created_at:'2026-11-05T16:00:00Z',
}
it('recorre la valoración, solicita glucemia simulada y registra un intento con cinco decisiones',async()=>{
  const onCompleted=vi.fn(async()=>{})
  const onSession=vi.fn()
  const onError=vi.fn()
  stub.submitSimulationAttempt.mockResolvedValue({session:auth,value:{
    ok:true,attempt_id:'de-prueba',score:10,max_score:10,correct_count:5,
    safety_cap_applied:false,
    checks:{priority:true,assessment:true,tests:true,action:true,recheck:true},
    attempt_number:1,
  }})
  const user=userEvent.setup()
  const c=clinicalCases[0]
  render(<ClinicalSimulator assignment={assignment} session={auth} attempts={[]}
    onSession={onSession} onCompleted={onCompleted} onError={onError}/>)
  await user.click(screen.getByRole('button',{name:/Iniciar atención simulada/}))
  for(let i=0;i<5;i++){
    await user.click(screen.getByText(c.stages[i].options[0].label))
    if(i<4) await user.click(screen.getByRole('button',{name:/Continuar/}))
  }
  expect(screen.getByText(/Glucosa capilar simulada: 56 mg\/dL/)).toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:/Finalizar y evaluar/}))
  expect(await screen.findByText('10/10')).toBeInTheDocument()
  expect(stub.submitSimulationAttempt).toHaveBeenCalledWith(auth,assignment.id,{
    priority:'abc',assessment:'glucosa',tests:'glucometria',action:'carbohidrato',recheck:'recontrol',
  })
  expect(onCompleted).toHaveBeenCalled()
})

it('permite vista previa docente sin registrar una calificación',async()=>{
  stub.submitSimulationAttempt.mockClear()
  const user=userEvent.setup()
  const c=clinicalCases[0]
  render(<ClinicalSimulator assignment={assignment} session={auth} preview attempts={[]}
    onSession={()=>{}} onCompleted={async()=>{}} onError={()=>{}}/>)
  await user.click(screen.getByRole('button',{name:/Abrir vista previa docente/}))
  for(let i=0;i<5;i++){
    await user.click(screen.getByText(c.stages[i].options[0].label))
    if(i<4)await user.click(screen.getByRole('button',{name:/Continuar/}))
  }
  await user.click(screen.getByRole('button',{name:/Finalizar y evaluar/}))
  expect(screen.getByText('Vista previa completada')).toBeInTheDocument()
  expect(stub.submitSimulationAttempt).not.toHaveBeenCalled()
})
