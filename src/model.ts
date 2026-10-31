export type Area = {
  id: string
  name: string
  description: string
  functions: string
  active: boolean
}
export type Career = { id: string; name: string }
export type Subject = {
  id: string
  name: string
  careerId: string
  referenceTeacherId: string
}
export type Unit = {
  id: string
  name: string
  subjectId: string
  content: string
  mediaUrl: string
}
export type Position = {
  id: string
  name: string
  parentId: string
  areaId: string
  responsibilities: string
}
export type Person = {
  id: string
  name: string
  kind: string
  positionId: string
  areaId: string
}
export type Option = {
  id: string
  text: string
  score: number
  feedback: string
}
export type Step = { id: string; prompt: string; options: Option[] }
export type ClinicalCase = {
  id: string
  name: string
  type: string
  description: string
  patient: string
  history: string
  vitals: string
  findings: string
  careerId: string
  subjectId: string
  unitId: string
  areaId: string
  difficulty: string
  active: boolean
  steps: Step[]
}
export type Attempt = {
  id: string
  caseId: string
  caseName: string
  date: string
  score: number
  answers: { step: string; choice: string; feedback: string; score: number }[]
}
export type Settings = { id: string; name: string; welcome: string }
export type Database = {
  version: 1
  areas: Area[]
  careers: Career[]
  subjects: Subject[]
  units: Unit[]
  positions: Position[]
  people: Person[]
  cases: ClinicalCase[]
  attempts: Attempt[]
  settings: Settings[]
}
export type Collection = Exclude<keyof Database, 'version' | 'attempts'>
export const uid = () => crypto.randomUUID()
export function resultScore(scores: number[]) {
  return scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0
}
export function safeUrl(url: string) {
  try {
    const u = new URL(url)
    return ['https:', 'http:'].includes(u.protocol) ? u.href : null
  } catch {
    return null
  }
}
