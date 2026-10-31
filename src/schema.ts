import type { Collection } from './model'
export type Field = {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'select' | 'checkbox' | 'number'
  ref?: Collection
  choices?: string[]
  required?: boolean
}
const name: Field = { key: 'name', label: 'Nombre', required: true }
const ref = (
  key: string,
  label: string,
  collection: Collection,
  required = false,
): Field => ({ key, label, ref: collection, type: 'select', required })
export const schemas: Record<Collection, { label: string; fields: Field[] }> = {
  areas: {
    label: 'Áreas hospitalarias',
    fields: [
      name,
      {
        key: 'description',
        label: 'Descripción',
        type: 'textarea',
        required: true,
      },
      {
        key: 'functions',
        label: 'Funciones',
        type: 'textarea',
        required: true,
      },
      { key: 'active', label: 'Área activa', type: 'checkbox' },
    ],
  },
  careers: { label: 'Carreras', fields: [name] },
  subjects: {
    label: 'Asignaturas',
    fields: [
      name,
      ref('careerId', 'Carrera (puede quedar sin asignar)', 'careers'),
      ref('referenceTeacherId', 'Docente de referencia ficticio', 'people'),
    ],
  },
  units: {
    label: 'Unidades y contenidos',
    fields: [
      name,
      ref('subjectId', 'Asignatura', 'subjects', true),
      {
        key: 'content',
        label: 'Contenido educativo',
        type: 'textarea',
        required: true,
      },
      { key: 'mediaUrl', label: 'Enlace multimedia (http o https, opcional)' },
    ],
  },
  positions: {
    label: 'Cargos hospitalarios',
    fields: [
      name,
      ref('parentId', 'Depende de', 'positions'),
      ref('areaId', 'Área', 'areas'),
      {
        key: 'responsibilities',
        label: 'Responsabilidades',
        type: 'textarea',
        required: true,
      },
    ],
  },
  people: {
    label: 'Profesionales y estudiantes',
    fields: [
      name,
      {
        key: 'kind',
        label: 'Tipo',
        type: 'select',
        choices: [
          'Profesional',
          'Estudiante',
          'Docente de referencia',
          'Personal de apoyo',
        ],
        required: true,
      },
      ref('positionId', 'Cargo', 'positions'),
      ref('areaId', 'Área', 'areas'),
    ],
  },
  cases: {
    label: 'Casos, actividades y evaluaciones',
    fields: [
      name,
      {
        key: 'type',
        label: 'Modalidad',
        type: 'select',
        choices: ['Simulación', 'Actividad', 'Evaluación'],
        required: true,
      },
      {
        key: 'description',
        label: 'Objetivo',
        type: 'textarea',
        required: true,
      },
      {
        key: 'patient',
        label: 'Paciente o contexto ficticio',
        type: 'textarea',
        required: true,
      },
      { key: 'history', label: 'Antecedentes', type: 'textarea' },
      { key: 'vitals', label: 'Signos vitales', type: 'textarea' },
      { key: 'findings', label: 'Hallazgos', type: 'textarea' },
      ref('careerId', 'Carrera (vacío: interdisciplinario)', 'careers'),
      ref('subjectId', 'Asignatura', 'subjects', true),
      ref('unitId', 'Unidad', 'units', true),
      ref('areaId', 'Área hospitalaria', 'areas', true),
      {
        key: 'difficulty',
        label: 'Dificultad',
        type: 'select',
        choices: ['Inicial', 'Intermedia', 'Avanzada'],
        required: true,
      },
      { key: 'active', label: 'Actividad publicada', type: 'checkbox' },
    ],
  },
  settings: {
    label: 'Configuración general',
    fields: [
      name,
      {
        key: 'welcome',
        label: 'Mensaje de bienvenida',
        type: 'textarea',
        required: true,
      },
    ],
  },
}
