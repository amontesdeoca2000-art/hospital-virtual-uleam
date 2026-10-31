import { seed } from '../data/seed'
import { safeUrl, type Collection, type Database } from '../model'
import { schemas } from '../schema'
export const STORAGE_KEY = 'hv-uleam:v1'
export const cloneSeed = (): Database => JSON.parse(JSON.stringify(seed))
export function validateDatabase(value: unknown): asserts value is Database {
  if (!value || typeof value !== 'object' || (value as Database).version !== 1)
    throw new Error('Respaldo incompatible: se requiere la versión 1.')
  const db = value as Database
  for (const [collection, schema] of Object.entries(schemas)) {
    const records = db[collection as Collection]
    if (!Array.isArray(records) || records.length > 2000)
      throw new Error('Colección inválida: ' + schema.label)
    const ids = new Set<string>()
    for (const record of records) {
      if (
        !record ||
        typeof record !== 'object' ||
        typeof record.id !== 'string' ||
        !record.id ||
        ids.has(record.id)
      )
        throw new Error('Identificador inválido o repetido en ' + schema.label)
      ids.add(record.id)
      const row = record as unknown as Record<string, unknown>
      for (const field of schema.fields) {
        const v = row[field.key]
        if (field.type === 'checkbox') {
          if (typeof v !== 'boolean')
            throw new Error('Estado inválido: ' + field.label)
          continue
        }
        if (
          typeof v !== 'string' ||
          v.length > 20000 ||
          (field.required && !v.trim())
        )
          throw new Error(
            'Revisa el campo ' + field.label + ' en ' + record.name,
          )
        if (field.choices && !field.choices.includes(v))
          throw new Error('Selección inválida: ' + field.label)
      }
    }
  }
  if (db.settings.length !== 1)
    throw new Error('Debe existir una configuración general.')
  for (const [collection, schema] of Object.entries(schemas))
    for (const record of db[collection as Collection]) {
      const row = record as unknown as Record<string, string>
      for (const f of schema.fields)
        if (f.ref && row[f.key] && !db[f.ref].some((r) => r.id === row[f.key]))
          throw new Error(
            'Hay referencias en uso o inexistentes: ' +
              f.label +
              ' en ' +
              record.name +
              '. Reasigna antes de eliminar.',
          )
    }
  for (const unit of db.units)
    if (unit.mediaUrl && !safeUrl(unit.mediaUrl))
      throw new Error('El enlace multimedia debe usar http o https.')
  for (const position of db.positions) {
    const visited = new Set<string>([position.id])
    let parent = position.parentId
    while (parent) {
      if (visited.has(parent))
        throw new Error('El organigrama no puede contener ciclos.')
      visited.add(parent)
      parent = db.positions.find((p) => p.id === parent)?.parentId ?? ''
    }
  }
  for (const item of db.cases) {
    if (
      db.units.find((u) => u.id === item.unitId)?.subjectId !== item.subjectId
    )
      throw new Error('La unidad debe pertenecer a la asignatura del caso.')
    const subjectCareer = db.subjects.find(
      (s) => s.id === item.subjectId,
    )?.careerId
    if (item.careerId && subjectCareer && item.careerId !== subjectCareer)
      throw new Error('La carrera del caso debe coincidir con su asignatura.')
    if (
      !Array.isArray(item.steps) ||
      !item.steps.length ||
      item.steps.length > 50
    )
      throw new Error('Cada actividad necesita de 1 a 50 pasos.')
    const stepIds = new Set<string>()
    for (const step of item.steps) {
      if (
        !step ||
        typeof step.id !== 'string' ||
        !step.id ||
        stepIds.has(step.id) ||
        typeof step.prompt !== 'string' ||
        !step.prompt.trim() ||
        !Array.isArray(step.options) ||
        step.options.length < 2 ||
        step.options.length > 8
      )
        throw new Error(
          'Cada paso necesita una pregunta y de 2 a 8 opciones distintas.',
        )
      stepIds.add(step.id)
      const optionIds = new Set<string>()
      for (const o of step.options) {
        if (
          !o ||
          typeof o.id !== 'string' ||
          !o.id ||
          optionIds.has(o.id) ||
          typeof o.text !== 'string' ||
          !o.text.trim() ||
          typeof o.feedback !== 'string' ||
          !o.feedback.trim() ||
          !Number.isFinite(o.score) ||
          o.score < 0 ||
          o.score > 100
        )
          throw new Error(
            'Completa opciones, retroalimentación y puntajes entre 0 y 100.',
          )
        optionIds.add(o.id)
      }
      if (!step.options.some((o) => o.score === 100))
        throw new Error(
          'Cada paso debe tener al menos una opción de 100 puntos.',
        )
    }
  }
  if (!Array.isArray(db.attempts) || db.attempts.length > 10000)
    throw new Error('Historial de intentos inválido.')
  const attemptsIds = new Set<string>()
  for (const a of db.attempts) {
    if (
      !a ||
      typeof a.id !== 'string' ||
      !a.id ||
      attemptsIds.has(a.id) ||
      typeof a.caseId !== 'string' ||
      typeof a.caseName !== 'string' ||
      !Number.isFinite(Date.parse(a.date)) ||
      !Number.isFinite(a.score) ||
      a.score < 0 ||
      a.score > 100 ||
      !Array.isArray(a.answers) ||
      !a.answers.length ||
      a.answers.length > 50
    )
      throw new Error('Resultado inválido en el historial.')
    attemptsIds.add(a.id)
    for (const answer of a.answers)
      if (
        !answer ||
        typeof answer.step !== 'string' ||
        typeof answer.choice !== 'string' ||
        typeof answer.feedback !== 'string' ||
        !Number.isFinite(answer.score) ||
        answer.score < 0 ||
        answer.score > 100
      )
        throw new Error('Respuesta inválida en el historial.')
  }
}
export interface Repository {
  load(): { data: Database; warning?: string }
  save(data: Database): void
}
export const localRepository: Repository = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { data: cloneSeed() }
      const data: unknown = JSON.parse(raw)
      validateDatabase(data)
      return { data }
    } catch {
      return {
        data: cloneSeed(),
        warning:
          'No se pudieron leer los datos locales. Se muestra la demostración. Exporta lo que necesites antes de guardar; los datos anteriores no se han sobrescrito.',
      }
    }
  },
  save(data) {
    validateDatabase(data)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      throw new Error(
        'No se pudo guardar en este navegador. Comprueba el espacio y los permisos de almacenamiento. Los cambios no se han aplicado.',
      )
    }
  },
}
export function parseBackup(raw: string): Database {
  if (raw.length > 5_000_000)
    throw new Error('El respaldo supera el límite de 5 MB.')
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('El archivo no contiene JSON válido.')
  }
  validateDatabase(data)
  return data
}
