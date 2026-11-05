import { describe, expect, it } from 'vitest'
import { clinicalCases, stageKeys, validScenario } from './clinicalScenarios'

describe('casos clínicos de Enfermería', () => {
  it('incluye tres casos con cinco decisiones evaluables cada uno', () => {
    expect(clinicalCases).toHaveLength(3)
    expect(new Set(clinicalCases.map(c=>c.id)).size).toBe(3)
    for (const c of clinicalCases) {
      expect(validScenario(c.id)).toBe(true)
      expect(c.stages).toHaveLength(stageKeys.length)
      expect(c.vitalSigns.length).toBeGreaterThanOrEqual(4)
      expect(c.learning.length).toBeGreaterThanOrEqual(2)
      for (const stage of c.stages) {
        expect(new Set(stage.options.map(o=>o.id)).size).toBe(stage.options.length)
        expect(stage.options.length).toBeGreaterThanOrEqual(3)
      }
      expect(c.stages[2].options.some(o=>o.id===c.requestedTestId)).toBe(true)
      expect(c.sourceUrl).toMatch(/^https:\/\//)
    }
  })
})
