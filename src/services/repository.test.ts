import { describe, expect, it, vi } from 'vitest'
import {
  cloneSeed,
  localRepository,
  parseBackup,
  STORAGE_KEY,
  validateDatabase,
} from './repository'
import { resultScore } from '../model'
describe('Repositorio local y respaldo', () => {
  it('incluye el hospital y seis actividades completas', () => {
    const db = cloneSeed()
    expect(() => validateDatabase(db)).not.toThrow()
    expect(db.areas).toHaveLength(18)
    expect(db.cases).toHaveLength(6)
    expect(db.cases.every((c) => c.steps.length === 3)).toBe(true)
  })
  it('persiste y restaura contenido editable', () => {
    const db = cloneSeed()
    db.areas[0].name = 'Admisión editada'
    localRepository.save(db)
    expect(localRepository.load().data.areas[0].name).toBe('Admisión editada')
    expect(parseBackup(JSON.stringify(db))).toEqual(db)
  })
  it('no sobrescribe un almacenamiento corrupto al cargar', () => {
    localStorage.setItem(STORAGE_KEY, '{incorrecto')
    expect(localRepository.load().warning).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{incorrecto')
  })
  it('rechaza referencias rotas y ciclos', () => {
    const db = cloneSeed()
    db.areas = []
    expect(() => validateDatabase(db)).toThrow(/referencias/)
    const cyclic = cloneSeed()
    cyclic.positions[0].parentId = 'medico'
    expect(() => validateDatabase(cyclic)).toThrow(/ciclos/)
  })
  it('rechaza opciones sin explicación y sin respuesta óptima', () => {
    const db = cloneSeed()
    db.cases[0].steps[0].options[0].feedback = ''
    expect(() => validateDatabase(db)).toThrow(/Completa/)
    db.cases[0].steps[0].options[0].feedback = 'Razón'
    db.cases[0].steps[0].options[1].score = 0
    expect(() => validateDatabase(db)).toThrow(/100 puntos/)
  })
  it('rechaza enlaces ejecutables y unidades de otra asignatura', () => {
    const db = cloneSeed()
    db.units[0].mediaUrl = 'javascript:alert(1)'
    expect(() => validateDatabase(db)).toThrow(/enlace/)
    db.units[0].mediaUrl = ''
    db.cases[0].unitId = 'u-fisio'
    expect(() => validateDatabase(db)).toThrow(/unidad/)
  })
  it('rechaza versiones, formatos e historiales inválidos', () => {
    expect(() => parseBackup('{"version":2}')).toThrow(/versión/)
    expect(() => parseBackup('{incompleto')).toThrow(
      'El archivo no contiene JSON válido.',
    )
    const db = cloneSeed()
    db.attempts = [
      {
        id: 'a',
        caseId: 'c',
        caseName: 'c',
        date: 'nunca',
        score: 101,
        answers: [],
      },
    ]
    expect(() => validateDatabase(db)).toThrow(/Resultado/)
  })
  it('informa errores de guardado sin fingir persistencia', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota')
      })
    expect(() => localRepository.save(cloneSeed())).toThrow(
      /No se pudo guardar/,
    )
    spy.mockRestore()
  })
  it('calcula el promedio con redondeo', () => {
    expect(resultScore([100, 0, 100])).toBe(67)
    expect(resultScore([])).toBe(0)
  })
})
