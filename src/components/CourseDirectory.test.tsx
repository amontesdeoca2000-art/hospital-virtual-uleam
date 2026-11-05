import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CourseDirectory } from './CourseDirectory'
import { seed } from '../data/seed'

it('muestra las tres extensiones y permite navegar a los cursos de cada carrera', async () => {
  const user = userEvent.setup()
  const onEnter = vi.fn()
  render(<CourseDirectory subjects={seed.subjects} onEnter={onEnter} />)
  expect(screen.getByRole('button', { name: /Chone/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Tosagua/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Pedernales/ })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /Chone/ }))
  expect(screen.getByRole('button', { name: /Chone/ })).toHaveAttribute('aria-pressed', 'true')
  await user.click(screen.getByRole('button', { name: 'Enfermería' }))
  expect(screen.getByText('Fundamentos de Morfofisiología')).toBeInTheDocument()
  await user.click(screen.getAllByRole('button', { name: 'Explorar contenido' })[0])
  expect(onEnter).toHaveBeenCalledWith({
    extension: 'Chone', careerId: 'enfermeria', subjectId: 'fundamentos'
  })
})

it('aclara que todavía no existe matrícula ni cuentas personales', () => {
  render(<CourseDirectory subjects={seed.subjects} onEnter={() => {}} />)
  expect(screen.getByText(/matrícula y las cuentas personales se habilitarán/)).toBeInTheDocument()
  expect(screen.getByText(/Todavía no representan la oferta o las matrículas oficiales/)).toBeInTheDocument()
})
