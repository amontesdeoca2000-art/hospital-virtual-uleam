import { describe, expect, it } from 'vitest'
import { boneGroups, bones } from './bones'

describe('biblioteca anatómica de los 206 huesos', () => {
  it('contiene 206 huesos individualizados, con 80 axiales y 126 apendiculares', () => {
    expect(bones).toHaveLength(206)
    expect(bones.filter((b) => b.division === 'Axial')).toHaveLength(80)
    expect(bones.filter((b) => b.division === 'Apendicular')).toHaveLength(126)
    expect(new Set(bones.map((b) => b.id)).size).toBe(206)
    expect(new Set(bones.map((b) => b.name)).size).toBe(206)
  })

  it('incluye diez regiones con fichas educativas completas', () => {
    expect(boneGroups).toHaveLength(10)
    for (const bone of bones) {
      expect(boneGroups).toContain(bone.group)
      expect(bone.location.trim().length).toBeGreaterThan(5)
      expect(bone.function.trim().length).toBeGreaterThan(10)
      expect(bone.landmark.trim().length).toBeGreaterThan(5)
      expect(bone.clinical.trim().length).toBeGreaterThan(10)
    }
  })

  it('distribuye las regiones según el conteo clásico del adulto', () => {
    const groups: Record<string, number> = {
      'Cráneo': 8, 'Cara': 14, 'Oído medio': 6, 'Cuello': 1,
      'Columna vertebral': 26, 'Caja torácica': 25,
      'Cintura escapular': 4, 'Miembro superior': 60,
      'Cintura pélvica': 2, 'Miembro inferior': 60,
    }
    for (const [group, count] of Object.entries(groups)) {
      expect(bones.filter((b) => b.group === group)).toHaveLength(count)
    }
  })
})
