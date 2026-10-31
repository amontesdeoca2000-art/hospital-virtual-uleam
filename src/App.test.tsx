import { expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { localRepository } from './services/repository'
it('explora un área y abre su actividad', async () => {
  const u = userEvent.setup()
  render(<App />)
  await u.click(screen.getByRole('button', { name: 'Explorar el hospital' }))
  await u.click(screen.getByRole('button', { name: /Triaje/ }))
  const modal = screen.getByRole('dialog')
  expect(within(modal).getByText('Funciones del área')).toBeInTheDocument()
  await u.click(
    within(modal).getByRole('button', { name: 'Primeros minutos en triaje' }),
  )
  expect(
    screen.getByText('¿Qué decisión inicial es más apropiada?'),
  ).toBeInTheDocument()
})
it('crea, edita y elimina una carrera con persistencia', async () => {
  const u = userEvent.setup()
  render(<App />)
  await u.click(screen.getByRole('button', { name: 'Administración' }))
  await u.click(screen.getByRole('button', { name: /^Carreras/ }))
  await u.click(screen.getByRole('button', { name: 'Crear registro' }))
  await u.type(screen.getByLabelText('Nombre *'), 'Carrera ficticia')
  await u.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  expect(
    localRepository
      .load()
      .data.careers.some((c) => c.name === 'Carrera ficticia'),
  ).toBe(true)
  await u.click(screen.getByRole('button', { name: 'Editar Carrera ficticia' }))
  await u.clear(screen.getByLabelText('Nombre *'))
  await u.type(screen.getByLabelText('Nombre *'), 'Nueva carrera')
  await u.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await u.click(screen.getByRole('button', { name: 'Eliminar Nueva carrera' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('Confirmar eliminación')
  await u.click(
    screen.getByRole('button', { name: 'Eliminar definitivamente' }),
  )
  expect(
    localRepository.load().data.careers.some((c) => c.name === 'Nueva carrera'),
  ).toBe(false)
})
it('recorre una asignatura, una unidad y guarda un intento con feedback', async () => {
  const u = userEvent.setup()
  render(<App />)
  await u.click(screen.getByRole('button', { name: 'Mi recorrido académico' }))
  await u.selectOptions(screen.getByLabelText('Carrera'), 'fisioterapia')
  await u.selectOptions(screen.getByLabelText('Asignatura'), 'practicas')
  await u.click(
    screen.getByRole('button', { name: 'Movimiento y valoración funcional' }),
  )
  await u.click(screen.getByRole('button', { name: 'Comenzar actividad' }))
  for (let i = 0; i < 3; i++) {
    const choices = screen.getAllByRole('radio')
    await u.click(choices[i === 1 ? 0 : 1])
    await u.click(screen.getByRole('button', { name: 'Confirmar decisión' }))
    expect(screen.getByRole('status')).toHaveTextContent('puntos en este paso')
    await u.click(
      screen.getByRole('button', {
        name: i === 2 ? 'Ver resultado' : 'Siguiente decisión',
      }),
    )
  }
  expect(
    screen.getByText('Intento guardado en este navegador.'),
  ).toBeInTheDocument()
  expect(localRepository.load().data.attempts[0].score).toBe(67)
  await u.click(screen.getByRole('button', { name: 'Volver a actividades' }))
  await u.click(screen.getByRole('button', { name: 'Mis resultados' }))
  expect(screen.getAllByText('67/100').length).toBeGreaterThan(0)
})
it('muestra un organigrama y bloquea borrar áreas con referencias', async () => {
  const u = userEvent.setup()
  render(<App />)
  await u.click(screen.getByRole('button', { name: 'Equipo y organigrama' }))
  expect(screen.getByText('Director general')).toBeInTheDocument()
  await u.click(screen.getByRole('button', { name: 'Administración' }))
  await u.click(screen.getByRole('button', { name: 'Eliminar Triaje' }))
  await u.click(
    screen.getByRole('button', { name: 'Eliminar definitivamente' }),
  )
  expect(screen.getByRole('alert')).toHaveTextContent('referencias')
  expect(localRepository.load().data.areas.some((a) => a.id === 'triaje')).toBe(
    true,
  )
})
it('anuncia que salir de un caso sin finalizar no guarda intentos', async () => {
  const u = userEvent.setup()
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
  render(<App />)
  await u.click(
    screen.getAllByRole('button', { name: 'Comenzar actividad' })[0],
  )
  await u.click(screen.getByRole('button', { name: 'Cerrar ventana' }))
  expect(confirm).toHaveBeenCalled()
  expect(localRepository.load().data.attempts).toHaveLength(0)
  confirm.mockRestore()
})

it('crea un caso con opciones editables y lo elimina sin perder consistencia', async () => {
  const u = userEvent.setup()
  render(<App />)
  await u.click(screen.getByRole('button', { name: 'Administración' }))
  await u.click(screen.getByRole('button', { name: /Casos, actividades/ }))
  await u.click(screen.getByRole('button', { name: 'Crear registro' }))
  await u.type(screen.getByLabelText('Nombre *'), 'Caso de prueba ficticio')
  await u.type(
    screen.getByLabelText('Objetivo *'),
    'Practicar una decisión educativa',
  )
  await u.type(
    screen.getByLabelText('Paciente o contexto ficticio *'),
    'Persona completamente ficticia',
  )
  await u.selectOptions(screen.getByLabelText('Asignatura *'), 'fundamentos')
  await u.selectOptions(screen.getByLabelText('Unidad *'), 'u-anatomia')
  await u.selectOptions(
    screen.getByLabelText('Área hospitalaria *'),
    'simulacion',
  )
  await u.type(
    screen.getByLabelText('Pregunta'),
    '¿Qué estructura conecta músculo y hueso?',
  )
  await u.type(screen.getByLabelText('Opción 1'), 'Tendón')
  await u.type(screen.getByLabelText('Opción 2'), 'Ligamento')
  const feedback = screen.getAllByLabelText('Retroalimentación y consecuencia')
  await u.type(feedback[0], 'Correcto: el tendón transmite la fuerza.')
  await u.type(feedback[1], 'Revisa: el ligamento une huesos.')
  await u.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  const saved = localRepository
    .load()
    .data.cases.find((c) => c.name === 'Caso de prueba ficticio')
  expect(saved?.steps[0].options[0].score).toBe(100)
  await u.click(
    screen.getByRole('button', { name: 'Eliminar Caso de prueba ficticio' }),
  )
  await u.click(
    screen.getByRole('button', { name: 'Eliminar definitivamente' }),
  )
  expect(
    localRepository.load().data.cases.some((c) => c.id === saved?.id),
  ).toBe(false)
})

it('desactiva un área sin destruir los datos de sus actividades', async () => {
  const u = userEvent.setup()
  render(<App />)
  await u.click(screen.getByRole('button', { name: 'Administración' }))
  await u.click(screen.getByRole('button', { name: 'Editar Triaje' }))
  await u.click(screen.getByLabelText('Área activa'))
  await u.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await u.click(screen.getByRole('button', { name: 'Explorar el hospital' }))
  expect(
    screen.queryByRole('button', { name: /Triaje/ }),
  ).not.toBeInTheDocument()
  await u.click(
    screen.getByRole('button', { name: 'Simulaciones y prácticas' }),
  )
  expect(
    screen.queryByText('Primeros minutos en triaje'),
  ).not.toBeInTheDocument()
  expect(
    localRepository.load().data.cases.some((c) => c.id === 'caso-triaje'),
  ).toBe(true)
})
