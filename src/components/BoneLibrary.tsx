import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, RotateCcw, Search, Shuffle, Trophy } from 'lucide-react'
import { bones, boneGroups, type Bone } from '../data/bones'
import './BoneLibrary.css'

const storagePrefix = 'hv-uleam:bones-studied-v2:'
function readStudied(courseId: string): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(storagePrefix + courseId) || '[]')
    return Array.isArray(data) ? data.filter((id): id is string => typeof id === 'string') : []
  } catch { return [] }
}
type Question = { bone: Bone; options: string[] }
function questionFor(bone: Bone): Question {
  const alternatives = bones.filter((b) => b.group !== bone.group && b.name !== bone.name)
  const distractors = [...alternatives].sort(() => Math.random() - 0.5).slice(0, 3)
  return {
    bone,
    options: [bone.name, ...distractors.map((b) => b.name)].sort(() => Math.random() - 0.5),
  }
}
export function BoneLibrary({ courseId, enrolledStudied, onToggleStudied }: {
  courseId: string
  enrolledStudied?: string[]
  onToggleStudied?: (boneId: string, studied: boolean) => Promise<void>
}) {
  const [division, setDivision] = useState('Todas')
  const [group, setGroup] = useState('Todos')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Bone | null>(null)
  const [studied, setStudied] = useState<string[]>(() => readStudied(courseId))
  useEffect(() => { setStudied(readStudied(courseId)) }, [courseId])
  const [quiz, setQuiz] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [finished, setFinished] = useState(false)
  const visible = useMemo(() => bones.filter((b) =>
    (division === 'Todas' || b.division === division) &&
    (group === 'Todos' || b.group === group) &&
    (b.name + ' ' + b.location + ' ' + b.group).toLocaleLowerCase('es')
      .includes(query.trim().toLocaleLowerCase('es'))
  ), [division, group, query])
  const currentStudied = enrolledStudied ?? studied
  function toggleStudied(id: string) {
    if (onToggleStudied) {
      void onToggleStudied(id, !currentStudied.includes(id))
      return
    }
    const next = studied.includes(id) ? studied.filter((x) => x !== id) : [...studied, id]
    setStudied(next)
    try { localStorage.setItem(storagePrefix + courseId, JSON.stringify(next)) } catch { /* sin almacenamiento disponible */ }
  }
  function startQuiz() {
    const sample = [...bones].sort(() => Math.random() - 0.5).slice(0, 10)
    setQuiz(sample.map(questionFor))
    setAnswers({})
    setFinished(false)
    setSelected(null)
  }
  const score = quiz.filter((q, index) => answers[index] === q.bone.name).length
  return (
    <div className="bone-library">
      <section className="bone-hero">
        <div>
          <p className="eyebrow">MORFOFISIOLOGÍA BÁSICA · SISTEMA ÓSEO</p>
          <h2>Biblioteca interactiva de los 206 huesos</h2>
          <p>Explora cada hueso del esqueleto adulto, reconoce su ubicación, función y referencias anatómicas. Estudia a tu ritmo, marca tus avances y comprueba lo aprendido.</p>
          <div className="bone-hero-actions">
            <button className="primary" onClick={() => document.getElementById('catalogo-huesos')?.scrollIntoView({ behavior: 'smooth' })}>
              <BookOpen size={17} /> Explorar huesos
            </button>
            <button className="bone-quiz-launch" onClick={startQuiz}><Shuffle size={17} /> Practicar 10 preguntas</button>
          </div>
        </div>
        <div className="bone-hero-stat"><strong>206</strong><span>huesos del adulto</span></div>
      </section>
      <div className="bone-summary" aria-label="Composición y avance del esqueleto">
        <article><strong>80</strong><span>Esqueleto axial</span><small>Cráneo, columna y tórax</small></article>
        <article><strong>126</strong><span>Esqueleto apendicular</span><small>Cinturas y extremidades</small></article>
        <article><strong>{currentStudied.length}/206</strong><span>Huesos estudiados</span><progress value={currentStudied.length} max={206} aria-label="Progreso de estudio" /></article>
      </div>
      <div className="bone-note">El número 206 corresponde al modelo anatómico habitual del adulto. Algunas personas presentan variantes; en la infancia varios huesos aún no se han fusionado. Cada hueso derecho e izquierdo se cuenta por separado.</div>
      {quiz.length > 0 && (
        <section className="bone-quiz" aria-label="Cuestionario de huesos">
          <div className="bone-quiz-head">
            <div><p className="eyebrow">AUTOEVALUACIÓN FORMATIVA</p><h2>Desafío de identificación</h2></div>
            <button className="secondary" onClick={() => setQuiz([])}>Cerrar práctica</button>
          </div>
          {!finished ? <>
            <p>Selecciona el hueso que corresponde a la descripción de su ubicación anatómica. Puedes responder las diez preguntas antes de calificar.</p>
            {quiz.map((q, i) => (
              <fieldset className="bone-question" key={q.bone.id}>
                <legend><strong>{i + 1}.</strong> ¿Qué hueso se encuentra en: {q.bone.location.toLowerCase()}?</legend>
                <div className="bone-options">{q.options.map((option) => (
                  <label key={option}><input type="radio" name={'bone-answer-' + i} checked={answers[i] === option} onChange={() => setAnswers((a) => ({...a, [i]: option}))} />{option}</label>
                ))}</div>
              </fieldset>
            ))}
            <button className="primary" disabled={Object.keys(answers).length !== quiz.length} onClick={() => setFinished(true)}>Calificar mis respuestas</button>
          </> : <>
            <div className="bone-score"><Trophy size={27} /><strong>{score}/10 correctas</strong><span>{score * 10}% de aciertos · No es una nota oficial</span></div>
            {quiz.map((q, i) => (
              <div className="bone-feedback" key={q.bone.id}>
                <strong>{i + 1}. {answers[i] === q.bone.name ? '✓ Correcto' : '✗ Revisa tu respuesta'}</strong>
                <p>Respuesta correcta: {q.bone.name}. {q.bone.function}</p>
              </div>
            ))}
            <button className="primary" onClick={startQuiz}><RotateCcw size={16} /> Intentar otro cuestionario</button>
          </>}
        </section>
      )}
      <section id="catalogo-huesos" className="bone-catalogue">
        <div className="section-heading"><div><p className="eyebrow">ATLAS DE ESTUDIO</p><h2>Catálogo anatómico</h2></div><span className="badge">{visible.length} huesos encontrados</span></div>
        <div className="bone-filters">
          <label>Buscar hueso o región <span className="bone-search"><Search size={17} /><input aria-label="Buscar hueso o región" placeholder="Ej. fémur, C1, muñeca..." value={query} onChange={(e) => setQuery(e.target.value)} /></span></label>
          <label>División del esqueleto <select value={division} onChange={(e) => { setDivision(e.target.value); setGroup('Todos') }}><option>Todas</option><option>Axial</option><option>Apendicular</option></select></label>
          <label>Región anatómica <select value={group} onChange={(e) => setGroup(e.target.value)}><option>Todos</option>{boneGroups.filter((g) => division === 'Todas' || bones.some((b) => b.group === g && b.division === division)).map((g) => <option key={g}>{g}</option>)}</select></label>
        </div>
        <div className="bone-grid">
          {visible.map((bone) => (
            <button key={bone.id} className={'bone-card ' + (currentStudied.includes(bone.id) ? 'bone-studied' : '')}
              onClick={() => setSelected(bone)} aria-label={'Ver ficha de ' + bone.name}>
              <span className="bone-icon" aria-hidden="true">🦴</span>
              <span className="bone-card-copy"><small>{bone.group} · {bone.division}</small><strong>{bone.name}</strong><span>{bone.location}</span></span>
              {currentStudied.includes(bone.id) && <CheckCircle2 size={19} aria-label="Estudiado" />}
            </button>
          ))}
        </div>
        {!visible.length && <div className="empty">No encontramos huesos con esos filtros. Prueba otra búsqueda.</div>}
      </section>
      {selected && (
        <div className="bone-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
          <section className="bone-modal" role="dialog" aria-modal="true" aria-labelledby="bone-modal-heading">
            <div className="bone-modal-header"><div><p className="eyebrow">{selected.division} · {selected.group}</p><h2 id="bone-modal-heading">{selected.name}</h2></div><button className="secondary" onClick={() => setSelected(null)} aria-label="Cerrar ficha">Cerrar</button></div>
            <div className="bone-fact"><strong>¿Dónde se encuentra?</strong><p>{selected.location}</p></div>
            <div className="bone-fact"><strong>¿Cuál es su función?</strong><p>{selected.function}</p></div>
            <div className="bone-fact"><strong>¿Cómo reconocerlo?</strong><p>{selected.landmark}</p></div>
            <div className="bone-fact"><strong>Relación clínica</strong><p>{selected.clinical}</p></div>
            <button className={currentStudied.includes(selected.id) ? 'secondary' : 'primary'} onClick={() => toggleStudied(selected.id)}>
              <CheckCircle2 size={17} /> {currentStudied.includes(selected.id) ? 'Quitar marca de estudiado' : 'Marcar como estudiado'}
            </button>
            <p className="muted small">Este avance se guarda únicamente en este navegador. Uso educativo, no diagnóstico.</p>
          </section>
        </div>
      )}
    </div>
  )
}
