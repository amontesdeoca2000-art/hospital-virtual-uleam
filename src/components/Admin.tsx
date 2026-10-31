import { useRef, useState } from 'react'
import { Download, Upload, Plus, Pencil, Trash2, Save } from 'lucide-react'
import {
  type ClinicalCase,
  type Collection,
  type Database,
  type Step,
  uid,
} from '../model'
import { schemas } from '../schema'
import { parseBackup } from '../services/repository'
import { Modal } from './Modal'
type RecordValue = Record<string, string | boolean | Step[]>
export function Admin({
  data,
  commit,
}: {
  data: Database
  commit: (d: Database) => void
}) {
  const [resultsView, setResultsView] = useState(false)
  const [deleteAttempt, setDeleteAttempt] = useState<string | null>(null)
  const [collection, setCollection] = useState<Collection>('areas')
  const [editing, setEditing] = useState<RecordValue | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{
    id: string
    name: string
  } | null>(null)
  const [imported, setImported] = useState<Database | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const schema = schemas[collection]
  function open(id?: string) {
    const existing = data[collection].find((r) => r.id === id)
    setEditing(
      existing
        ? JSON.parse(JSON.stringify(existing))
        : Object.fromEntries([
            ['id', uid()],
            ...schema.fields.map((f) => [
              f.key,
              f.type === 'checkbox' ? true : (f.choices?.[0] ?? ''),
            ]),
            ...(collection === 'cases' ? [['steps', [newStep()]]] : []),
          ]),
    )
    setError('')
  }
  function apply(next: Database, success: string) {
    commit(next)
    setMessage(success)
    setError('')
  }
  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    try {
      const records = data[collection] as unknown as RecordValue[]
      const next = {
        ...data,
        [collection]: records.some((r) => r.id === editing.id)
          ? records.map((r) => (r.id === editing.id ? editing : r))
          : [...records, editing],
      }
      apply(next as Database, 'Cambios guardados en este navegador.')
      setEditing(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function updateStep(index: number, next: Step) {
    setEditing({
      ...editing!,
      steps: (editing!.steps as Step[]).map((s, i) => (i === index ? next : s)),
    })
  }
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'hospital-virtual-uleam-respaldo.json'
    a.click()
    URL.revokeObjectURL(url)
    setMessage(
      'Respaldo exportado. Consérvalo en un lugar seguro; contiene solo datos demostrativos.',
    )
  }
  return (
    <>
      <div className="notice">
        <strong>Administrador general · Modo demostración</strong>
        <p>
          Control central de todas las asignaturas. Este selector no es
          autenticación ni un control de acceso seguro. Usa solo información
          ficticia.
        </p>
      </div>
      <div className="toolbar">
        <div className="button-row">
          <button className="secondary" onClick={exportData}>
            <Download size={16} /> Exportar JSON
          </button>
          <button className="secondary" onClick={() => input.current?.click()}>
            <Upload size={16} /> Importar JSON
          </button>
          <input
            ref={input}
            hidden
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                if (f.size > 5_000_000)
                  throw new Error('El archivo supera 5 MB.')
                setImported(parseBackup(await f.text()))
                setError('')
              } catch (err) {
                setError('No se pudo importar: ' + (err as Error).message)
              }
            }}
          />
        </div>
        <span className="muted small">
          Los cambios se guardan en este dispositivo.
        </span>
      </div>
      <div className="admin-tabs" aria-label="Colecciones administrativas">
        {(Object.keys(schemas) as Collection[]).map((key) => (
          <button
            aria-pressed={key === collection && !resultsView}
            className={key === collection && !resultsView ? 'active' : ''}
            key={key}
            onClick={() => {
              setResultsView(false)
              setCollection(key)
              setQuery('')
              setError('')
              setMessage('')
            }}
          >
            {schemas[key].label} <span>{data[key].length}</span>
          </button>
        ))}
        <button
          className={resultsView ? 'active' : ''}
          aria-pressed={resultsView}
          onClick={() => setResultsView(true)}
        >
          Resultados demostrativos <span>{data.attempts.length}</span>
        </button>
      </div>
      {message && (
        <p role="status" className="success">
          {message}
        </p>
      )}
      {error && !editing && !pendingDelete && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {resultsView ? (
        <section className="panel">
          <h2>Resultados demostrativos</h2>
          <p className="muted small">
            Los puntajes se calculan con las opciones de cada actividad. Puedes
            modificar su escala al editar los casos; los intentos anteriores
            conservan su resultado original.
          </p>
          {!data.attempts.length && (
            <p className="empty">Aún no hay resultados.</p>
          )}
          {[...data.attempts].reverse().map((a) => (
            <article className="admin-result" key={a.id}>
              <div className="section-line">
                <strong>
                  {a.caseName} · {a.score}/100
                </strong>
                <button
                  className="icon-button danger"
                  aria-label={'Eliminar intento de ' + a.caseName}
                  onClick={() => setDeleteAttempt(a.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="muted small">
                {new Date(a.date).toLocaleString('es-EC')}
              </p>
              <details>
                <summary>Ver decisiones y retroalimentación</summary>
                {a.answers.map((answer, i) => (
                  <p key={i} className="small">
                    <strong>{answer.step}</strong>
                    <br />
                    {answer.choice} · {answer.score}/100
                    <br />
                    {answer.feedback}
                  </p>
                ))}
              </details>
            </article>
          ))}
        </section>
      ) : (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{schema.label}</h2>
              <p className="muted">Contenido editable de la demostración</p>
            </div>
            {collection !== 'settings' && (
              <button className="primary" onClick={() => open()}>
                <Plus size={17} /> Crear registro
              </button>
            )}
          </div>
          <label className="search-label">
            Buscar registros
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe un nombre…"
            />
          </label>
          <div className="records">
            {data[collection]
              .filter((r) =>
                r.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
              )
              .map((r) => (
                <article key={r.id}>
                  <div>
                    <strong>{r.name}</strong>
                    <p className="muted small">
                      {'active' in r
                        ? Boolean(r.active)
                          ? 'Activo'
                          : 'Desactivado'
                        : 'kind' in r
                          ? String(r.kind)
                          : collection === 'subjects'
                            ? data.careers.find(
                                (c) =>
                                  c.id ===
                                  ('careerId' in r ? String(r.careerId) : ''),
                              )?.name || 'Carrera sin asignar'
                            : 'Registro demostrativo'}
                    </p>
                  </div>
                  <div className="button-row">
                    <button
                      className="icon-button"
                      aria-label={'Editar ' + r.name}
                      onClick={() => open(r.id)}
                    >
                      <Pencil size={17} />
                    </button>
                    {collection !== 'settings' && (
                      <button
                        className="icon-button danger"
                        aria-label={'Eliminar ' + r.name}
                        onClick={() => {
                          setPendingDelete(r)
                          setError('')
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            {!data[collection].some((r) =>
              r.name.toLowerCase().includes(query.toLowerCase()),
            ) && <p className="empty">No hay registros que coincidan.</p>}
          </div>
        </section>
      )}
      {editing && (
        <Modal
          title={
            (data[collection].some((r) => r.id === editing.id)
              ? 'Editar'
              : 'Crear') +
            ' · ' +
            schema.label
          }
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save} className="editor-form">
            <div className="form-grid">
              {schema.fields.map((field) => (
                <label
                  key={field.key}
                  className={field.type === 'textarea' ? 'full' : ''}
                >
                  {field.label}
                  {field.required ? ' *' : ''}
                  {field.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={!!editing[field.key]}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          [field.key]: e.target.checked,
                        })
                      }
                    />
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={String(editing[field.key])}
                      onChange={(e) => {
                        const value = e.target.value
                        const updates: RecordValue = { [field.key]: value }
                        if (
                          collection === 'cases' &&
                          field.key === 'subjectId'
                        ) {
                          updates.unitId = ''
                          updates.careerId =
                            data.subjects.find((s) => s.id === value)
                              ?.careerId || ''
                        }
                        setEditing({ ...editing, ...updates })
                      }}
                    >
                      <option value="">Sin asignar</option>
                      {field.ref
                        ? data[field.ref]
                            .filter(
                              (r) =>
                                !(
                                  field.ref === 'positions' &&
                                  r.id === editing.id
                                ),
                            )
                            .filter(
                              (r) =>
                                !(
                                  collection === 'cases' &&
                                  field.key === 'unitId'
                                ) ||
                                ('subjectId' in r &&
                                  r.subjectId === editing.subjectId),
                            )
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                                {field.ref === 'subjects' && 'careerId' in r
                                  ? ' · ' +
                                    (data.careers.find(
                                      (c) =>
                                        c.id ===
                                        ('careerId' in r
                                          ? String(r.careerId)
                                          : ''),
                                    )?.name || 'Sin carrera')
                                  : ''}
                              </option>
                            ))
                        : field.choices?.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      maxLength={20000}
                      rows={3}
                      value={String(editing[field.key])}
                      onChange={(e) =>
                        setEditing({ ...editing, [field.key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      required={field.required}
                      maxLength={20000}
                      value={String(editing[field.key])}
                      onChange={(e) =>
                        setEditing({ ...editing, [field.key]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
            {collection === 'cases' && (
              <section className="steps-editor">
                <h3>Pasos de decisión</h3>
                <p className="muted small">
                  Cada paso necesita al menos dos opciones y una de 100 puntos.
                  Explica todas las respuestas. El recorrido de esta etapa es
                  secuencial.
                </p>
                {(editing.steps as ClinicalCase['steps']).map((step, i) => (
                  <fieldset key={step.id}>
                    <legend>Paso {i + 1}</legend>
                    <label>
                      Pregunta
                      <textarea
                        required
                        value={step.prompt}
                        onChange={(e) =>
                          updateStep(i, { ...step, prompt: e.target.value })
                        }
                      />
                    </label>
                    {step.options.map((o, j) => (
                      <div className="option-editor" key={o.id}>
                        <label>
                          Opción {j + 1}
                          <input
                            required
                            value={o.text}
                            onChange={(e) =>
                              updateStep(i, {
                                ...step,
                                options: step.options.map((x) =>
                                  x.id === o.id
                                    ? { ...x, text: e.target.value }
                                    : x,
                                ),
                              })
                            }
                          />
                        </label>
                        <label>
                          Puntos (0–100)
                          <input
                            type="number"
                            min="0"
                            max="100"
                            required
                            value={o.score}
                            onChange={(e) =>
                              updateStep(i, {
                                ...step,
                                options: step.options.map((x) =>
                                  x.id === o.id
                                    ? { ...x, score: Number(e.target.value) }
                                    : x,
                                ),
                              })
                            }
                          />
                        </label>
                        <label className="full">
                          Retroalimentación y consecuencia
                          <textarea
                            required
                            value={o.feedback}
                            onChange={(e) =>
                              updateStep(i, {
                                ...step,
                                options: step.options.map((x) =>
                                  x.id === o.id
                                    ? { ...x, feedback: e.target.value }
                                    : x,
                                ),
                              })
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="text-button danger"
                          disabled={step.options.length <= 2}
                          onClick={() =>
                            updateStep(i, {
                              ...step,
                              options: step.options.filter(
                                (x) => x.id !== o.id,
                              ),
                            })
                          }
                        >
                          Quitar opción {j + 1}
                        </button>
                      </div>
                    ))}
                    <div className="button-row">
                      <button
                        type="button"
                        className="secondary"
                        disabled={step.options.length >= 8}
                        onClick={() =>
                          updateStep(i, {
                            ...step,
                            options: [
                              ...step.options,
                              { id: uid(), text: '', score: 0, feedback: '' },
                            ],
                          })
                        }
                      >
                        Añadir opción
                      </button>
                      <button
                        type="button"
                        className="text-button danger"
                        disabled={(editing.steps as Step[]).length === 1}
                        onClick={() =>
                          setEditing({
                            ...editing,
                            steps: (editing.steps as Step[]).filter(
                              (s) => s.id !== step.id,
                            ),
                          })
                        }
                      >
                        Quitar paso
                      </button>
                      {i > 0 && (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            const steps = [...(editing.steps as Step[])]
                            ;[steps[i - 1], steps[i]] = [steps[i], steps[i - 1]]
                            setEditing({ ...editing, steps })
                          }}
                        >
                          Subir paso
                        </button>
                      )}
                    </div>
                  </fieldset>
                ))}
                <button
                  className="secondary"
                  type="button"
                  disabled={(editing.steps as Step[]).length >= 50}
                  onClick={() =>
                    setEditing({
                      ...editing,
                      steps: [...(editing.steps as Step[]), newStep()],
                    })
                  }
                >
                  <Plus size={16} /> Añadir paso
                </button>
              </section>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="form-footer">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
              <button className="primary" type="submit">
                <Save size={16} /> Guardar cambios
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleteAttempt && (
        <Modal
          title="Eliminar resultado"
          onClose={() => setDeleteAttempt(null)}
        >
          <p>
            ¿Eliminar este intento del historial local? Esta acción no se puede
            deshacer sin un respaldo.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="form-footer">
            <button
              className="secondary"
              onClick={() => setDeleteAttempt(null)}
            >
              Cancelar
            </button>
            <button
              className="danger-button"
              onClick={() => {
                try {
                  apply(
                    {
                      ...data,
                      attempts: data.attempts.filter(
                        (a) => a.id !== deleteAttempt,
                      ),
                    },
                    'Intento eliminado.',
                  )
                  setDeleteAttempt(null)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              Eliminar intento
            </button>
          </div>
        </Modal>
      )}
      {pendingDelete && (
        <Modal
          title="Confirmar eliminación"
          onClose={() => setPendingDelete(null)}
        >
          <p>
            ¿Eliminar «{pendingDelete.name}»? No se puede deshacer sin un
            respaldo. Los registros con relaciones en uso deben reasignarse
            antes. Los resultados anteriores se conservarán.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="form-footer">
            <button
              className="secondary"
              onClick={() => setPendingDelete(null)}
            >
              Cancelar
            </button>
            <button
              className="danger-button"
              onClick={() => {
                try {
                  apply(
                    {
                      ...data,
                      [collection]: data[collection].filter(
                        (r) => r.id !== pendingDelete.id,
                      ),
                    },
                    'Registro eliminado.',
                  )
                  setPendingDelete(null)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              Eliminar definitivamente
            </button>
          </div>
        </Modal>
      )}
      {imported && (
        <Modal
          title="Reemplazar contenido local"
          onClose={() => setImported(null)}
        >
          <p>
            Se importarán {imported.areas.length} áreas, {imported.cases.length}{' '}
            actividades y {imported.attempts.length} resultados. Esto
            reemplazará todos los datos locales. Exporta primero un respaldo si
            quieres conservarlos.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="form-footer">
            <button className="secondary" onClick={() => setImported(null)}>
              Cancelar
            </button>
            <button
              className="primary"
              onClick={() => {
                try {
                  apply(imported, 'Respaldo importado y guardado.')
                  setImported(null)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              Confirmar importación
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
function newStep(): Step {
  return {
    id: uid(),
    prompt: '',
    options: [
      { id: uid(), text: '', score: 100, feedback: '' },
      { id: uid(), text: '', score: 0, feedback: '' },
    ],
  }
}
