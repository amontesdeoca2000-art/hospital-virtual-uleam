import { useMemo, useState } from 'react'
import {
  Activity, ArrowLeft, ArrowRight, BadgeCheck, ClipboardList, FileSearch, HeartPulse,
  RotateCcw, ShieldAlert, Stethoscope, TestTubeDiagonal,
} from 'lucide-react'
import { caseById, stageKeys, stageNames, type ClinicalStageKey } from '../data/clinicalScenarios'
import {
  type CourseAssignment, type Session, type SimulationAttempt, type SimulationGradeResult,
  submitSimulationAttempt,
} from '../services/campusApi'
import './ClinicalSimulator.css'

export function ClinicalSimulator({
  assignment, session, preview=false, attempts, onSession, onCompleted, onError,
}: {
  assignment: CourseAssignment
  session: Session
  preview?: boolean
  attempts: SimulationAttempt[]
  onSession: (s:Session)=>void
  onCompleted: ()=>Promise<void>
  onError: (s:string)=>void
}) {
  const scenario=caseById(assignment.scenario_id||'')
  const [step,setStep]=useState(0)
  const [answers,setAnswers]=useState<Partial<Record<ClinicalStageKey,string>>>({})
  const [result,setResult]=useState<SimulationGradeResult|null>(null)
  const [busy,setBusy]=useState(false)
  const [opened,setOpened]=useState(false)
  const options=useMemo(()=>scenario?.stages.map((s,index)=>{
    // Stable order per case on a visit; never assume the first option is the answer.
    const shuffled=[...s.options]
    for(let j=shuffled.length-1;j>0;j--){
      const idx=Math.floor(Math.random()*(j+1))
      ;[shuffled[j],shuffled[idx]]=[shuffled[idx],shuffled[j]]
    }
    return {index,options:shuffled}
  })||[],[scenario?.id])
  if(!scenario) return <p role="alert">Este escenario no está disponible. Solicita ayuda al docente.</p>
  const stage=scenario.stages[step]
  const key=stageKeys[step]
  const chosen=answers[key]
  const selectedTest=answers.tests
  const didSafeIntervene=answers.priority===scenario.stages[0].options[0].id &&
    answers.action===scenario.stages[3].options[0].id
  const previous=attempts.filter(a=>a.assignment_id===assignment.id)
  const reachedLimit=!preview&&previous.length>=5
  const best=previous.length?Math.max(...previous.map(a=>a.score)):null

  function restart() {
    setStep(0);setAnswers({});setResult(null);setOpened(true);onError('')
  }
  async function finish() {
    if(preview){
      setResult({ok:true,attempt_id:'preview',score:0,max_score:assignment.max_score,
        checks:{},correct_count:0,safety_cap_applied:false,attempt_number:0})
      return
    }
    if(reachedLimit)return
    if(stageKeys.some(k=>!answers[k])){onError('Responde las cinco decisiones del caso.');return}
    setBusy(true);onError('')
    try{
      const payload=Object.fromEntries(stageKeys.map(k=>[k,answers[k]||'']))
      const response=await submitSimulationAttempt(session,assignment.id,payload)
      onSession(response.session)
      setResult(response.value)
      await onCompleted()
    }catch(e){onError(e instanceof Error?e.message:'No se pudo registrar la simulación.')}
    finally{setBusy(false)}
  }
  return <div className="clinical-sim">
    <header className="clinical-sim-head">
      <div><p className="eyebrow">{scenario.service} · {scenario.difficulty}</p>
        <h3><Stethoscope size={20}/>{scenario.title}</h3>
        <p>Simulación de Enfermería · 5 decisiones · Puntaje máximo {assignment.max_score}</p>
      </div>
      <div className="clinical-case-id"><ClipboardList size={20}/><span>CASO CLÍNICO<br/><strong>FICTICIO</strong></span></div>
    </header>
    {!opened?<div className="clinical-intro">
      <p>En este ejercicio actuarás como profesional de Enfermería. Debes identificar prioridades, valorar al paciente, seleccionar estudios pertinentes para coordinar con el equipo y decidir cuidados y reevaluaciones.</p>
      <div className="clinical-info-chips"><span>5 etapas</span><span>Resultados de pruebas simulados</span><span>Decisiones con consecuencias</span></div>
      <p className="clinical-warning"><ShieldAlert size={16}/> No se emiten órdenes médicas reales. Sigue protocolos institucionales y las indicaciones del equipo tratante.</p>
      {best!==null&&<p>Mejor resultado previo: <strong>{best}/{assignment.max_score}</strong> · {previous.length} de 5 intentos.</p>}
      {preview?<button className="primary" onClick={()=>setOpened(true)}>Abrir vista previa docente <ArrowRight size={16}/></button>:
        reachedLimit?<p className="clinical-warning">Has completado los 5 intentos permitidos para esta simulación.</p>:
        <button className="primary" onClick={()=>setOpened(true)}>Iniciar atención simulada <ArrowRight size={16}/></button>}
    </div>:<>
      <div className="clinical-content">
        <aside className="clinical-patient">
          <div className="clinical-patient-photo"><HeartPulse size={42}/><div><strong>Paciente simulado</strong><span>{scenario.age} · {scenario.sex}</span></div></div>
          <section><strong>Motivo de consulta</strong><p>{scenario.reason}</p></section>
          <section><strong>Antecedentes relevantes</strong><p>{scenario.history}</p></section>
          <section><strong>Observación inicial</strong><ul>{scenario.observations.map(o=><li key={o}>{o}</li>)}</ul></section>
          <section><strong>Monitor de signos vitales</strong>
            <div className="clinical-vitals">{scenario.vitalSigns.map(v=><div key={v.label} className={v.alarm?'alarm':''}><small>{v.label}</small><strong>{v.value}</strong></div>)}</div>
          </section>
        </aside>
        <div className="clinical-workspace">
          {result?<>
            <div className="clinical-result">
              {preview?<><BadgeCheck size={28}/><h3>Vista previa completada</h3><p>No se ha creado ningún intento ni calificación de estudiante.</p></>:
              <><BadgeCheck size={28}/><h3>Atención simulada finalizada</h3><strong className="clinical-big-score">{result.score}/{result.max_score}</strong>
              <p>{result.correct_count} de 5 decisiones óptimas según la rúbrica.</p>
              {result.safety_cap_applied&&<p className="clinical-warning">El puntaje se limitó al 60 % por una decisión crítica de seguridad. La prioridad y las intervenciones seguras tienen mayor relevancia.</p>}
              {stageKeys.map((k,i)=><div className="clinical-grade-step" key={k}>
                <span>{result.checks[k]?'✓':'✕'}</span><strong>{stageNames[i]}</strong><small>{result.checks[k]?'Decisión adecuada':'Revisar razonamiento y protocolos'}</small>
              </div>)}</>}
              <div className="clinical-debrief">
                <h4>Retroalimentación clínica</h4>
                {scenario.learning.map(p=><p key={p}>• {p}</p>)}
                <p><a href={scenario.sourceUrl} target="_blank" rel="noreferrer">{scenario.sourceLabel}</a></p>
                <small>Este ejercicio ofrece retroalimentación formativa, no valida competencias prácticas ni sustituye supervisión profesional.</small>
              </div>
              {preview||!reachedLimit?<button className="secondary" onClick={restart}><RotateCcw size={15}/> {preview?'Repetir vista previa':'Nuevo intento'}</button>:null}
              </div>
          </>:<>
            <nav className="clinical-steps" aria-label="Etapas de atención">{stageNames.map((label,i)=><div key={label} className={step===i?'active':i<step?'done':''}><span>{i+1}</span><small>{label}</small></div>)}</nav>
            <div className="clinical-stage">
              <p className="eyebrow">ETAPA {step+1} DE 5 · {stageNames[step]}</p>
              <h4>{stage.prompt}</h4>
              {step===2&&<p className="clinical-context"><FileSearch size={15}/> Al seleccionar un estudio, el hospital simula su solicitud o coordinación. No genera órdenes reales.</p>}
              <div className="clinical-options">{options[step].options.map(o=><label className={chosen===o.id?'selected':''} key={o.id}>
                <input type="radio" name={'stage-'+step} value={o.id} checked={chosen===o.id}
                  onChange={()=>setAnswers(before=>({...before,[key]:o.id}))}/>
                <span>{o.label}</span>
              </label>)}</div>
              {step>=3&&<div className="clinical-test-result">
                <h4><TestTubeDiagonal size={17}/> Resultado de estudios simulados</h4>
                <p>{selectedTest===scenario.requestedTestId?scenario.testResult:scenario.alternativeResult}</p>
              </div>}
              {step===4&&<div className="clinical-test-result">
                <h4><Activity size={17}/> Evolución del paciente en el escenario</h4>
                <p>{didSafeIntervene?scenario.stableOutcome:scenario.unstableOutcome}</p>
                <p>Elabora tu entrega SBAR considerando antecedentes, signos vitales, decisiones y respuesta del paciente.</p>
              </div>}
              <div className="clinical-navigation">
                {step>0&&<button type="button" className="secondary" onClick={()=>setStep(n=>n-1)}><ArrowLeft size={15}/> Anterior</button>}
                <button type="button" className="primary" disabled={!chosen||busy}
                  onClick={()=>step<4?setStep(n=>n+1):void finish()}>
                  {busy?'Guardando…':step<4?'Continuar':'Finalizar y evaluar'} <ArrowRight size={15}/>
                </button>
              </div>
            </div>
          </>}
        </div>
      </div>
    </>}
  </div>
}
