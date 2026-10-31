import { useState } from 'react'
import { ArrowRight, CheckCircle2, RotateCcw, Trophy } from 'lucide-react'
import { resultScore, uid, type Attempt, type ClinicalCase } from '../model'
export function Simulator({
  item,
  onSave,
  onClose,
}: {
  item: ClinicalCase
  onSave: (a: Attempt) => void
  onClose: () => void
}) {
  const [answers, setAnswers] = useState<Attempt['answers']>([])
  const [choice, setChoice] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [finished, setFinished] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [runId, setRunId] = useState(uid)
  const step = item.steps[answers.length]
  const selected = step?.options.find((o) => o.id === choice)
  function finish() {
    const next = [
      ...answers,
      {
        step: step.prompt,
        choice: selected!.text,
        feedback: selected!.feedback,
        score: selected!.score,
      },
    ]
    setAnswers(next)
    setFinished(true)
    persist(next)
  }
  function persist(values: Attempt['answers']) {
    try {
      onSave({
        id: runId,
        caseId: item.id,
        caseName: item.name,
        date: new Date().toISOString(),
        score: resultScore(values.map((a) => a.score)),
        answers: values,
      })
      setSaved(true)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function restart() {
    setAnswers([])
    setChoice('')
    setConfirmed(false)
    setFinished(false)
    setSaved(false)
    setError('')
    setRunId(uid())
  }
  return (
    <div className="simulator">
      <p className="notice small">
        Simulación educativa · Datos ficticios · No sustituye protocolos ni
        supervisión docente.
      </p>
      {finished ? (
        <div className="result">
          <Trophy size={48} />
          <p className="eyebrow">PRÁCTICA FINALIZADA</p>
          <h3>
            {resultScore(answers.map((a) => a.score))} <span>/ 100</span>
          </h3>
          <p>
            {resultScore(answers.map((a) => a.score)) >= 80
              ? 'Buen trabajo. Revisa las razones de cada decisión y conversa con tu docente.'
              : 'Sigue practicando. Revisa las explicaciones antes de volver a intentarlo.'}
          </p>
          <p className="muted">
            {saved
              ? 'Intento guardado en este navegador.'
              : 'El resultado todavía no se ha guardado.'}
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {!saved && (
            <button className="primary" onClick={() => persist(answers)}>
              Reintentar guardar resultado
            </button>
          )}
          <div className="answer-summary">
            {answers.map((a, i) => (
              <article key={i}>
                <strong>
                  {i + 1}. {a.step}
                </strong>
                <p>
                  {a.choice} · {a.score}/100
                </p>
                <p>{a.feedback}</p>
              </article>
            ))}
          </div>
          <div className="button-row">
            <button className="secondary" onClick={restart}>
              <RotateCcw size={16} /> Repetir práctica
            </button>
            <button className="primary" onClick={onClose}>
              Volver a actividades
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="patient">
            <h3>Contexto del caso</h3>
            <p>{item.patient}</p>
            <dl>
              <dt>Antecedentes</dt>
              <dd>{item.history || 'No especificados.'}</dd>
              <dt>Signos vitales</dt>
              <dd>{item.vitals || 'No especificados.'}</dd>
              <dt>Hallazgos</dt>
              <dd>{item.findings || 'No especificados.'}</dd>
            </dl>
          </div>
          <div className="section-line">
            <span>
              Paso {answers.length + 1} de {item.steps.length}
            </span>
            <span>
              {Math.round((answers.length / item.steps.length) * 100)} %
            </span>
          </div>
          <progress
            max={item.steps.length}
            value={answers.length}
            aria-label="Progreso de la actividad"
          />
          <fieldset className="decision">
            <legend>{step.prompt}</legend>
            {step.options.map((o, i) => (
              <label
                className={`option ${choice === o.id ? 'selected' : ''}`}
                key={o.id}
              >
                <input
                  type="radio"
                  name="decision"
                  value={o.id}
                  checked={choice === o.id}
                  disabled={confirmed}
                  onChange={() => setChoice(o.id)}
                />
                <span className="option-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{o.text}</span>
              </label>
            ))}
          </fieldset>
          {confirmed && selected && (
            <div
              className={`feedback ${selected.score === 100 ? 'correct' : ''}`}
              role="status"
            >
              <strong>
                <CheckCircle2 size={18} /> {selected.score}/100 puntos en este
                paso
              </strong>
              <p>{selected.feedback}</p>
              <p className="small">
                Consecuencia simulada:{' '}
                {selected.score === 100
                  ? 'la decisión favorece el objetivo de aprendizaje.'
                  : 'esta elección requiere revisión antes de avanzar en una práctica real.'}
              </p>
            </div>
          )}
          <div className="form-footer">
            {!confirmed ? (
              <button
                className="primary"
                disabled={!selected}
                onClick={() => setConfirmed(true)}
              >
                Confirmar decisión <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="primary"
                onClick={() => {
                  if (answers.length === item.steps.length - 1) finish()
                  else {
                    setAnswers([
                      ...answers,
                      {
                        step: step.prompt,
                        choice: selected!.text,
                        feedback: selected!.feedback,
                        score: selected!.score,
                      },
                    ])
                    setChoice('')
                    setConfirmed(false)
                  }
                }}
              >
                {answers.length === item.steps.length - 1
                  ? 'Ver resultado'
                  : 'Siguiente decisión'}{' '}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
