import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SecureCampus } from './SecureCampus'

const fake = vi.hoisted(() => ({
  restoreSession: vi.fn<() => unknown>(() => null),
  signUp: vi.fn(async () => ({confirmed:false,session:null})),
  signIn: vi.fn(), signOut: vi.fn(),
  refreshSession: vi.fn(), getProfile: vi.fn(),
  getCourses: vi.fn(), getEnrollments: vi.fn(),
  enroll: vi.fn(), getMaterials: vi.fn(), getBoneProgress: vi.fn(),
  saveBoneProgress: vi.fn(), createCourse: vi.fn(),
  setCourseCode: vi.fn(), publishCourse: vi.fn(), addMaterial: vi.fn(),
}))
vi.mock('../services/campusApi', () => ({
  ...fake,
}))

it('ofrece registro con nombres, correo, contraseña y las tres extensiones', async () => {
  const user = userEvent.setup()
  render(<SecureCampus />)
  await user.click(await screen.findByRole('button', {name:'Crear cuenta'}))
  expect(screen.getByLabelText('Nombres y apellidos')).toBeInTheDocument()
  expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
  expect(screen.getByLabelText('Contraseña personal')).toBeInTheDocument()
  const extensions = screen.getByLabelText('Extensión') as HTMLSelectElement
  expect(Array.from(extensions.options).map(o=>o.value)).toEqual(['Pedernales','Chone','Tosagua'])
  await user.type(screen.getByLabelText('Nombres y apellidos'), 'Ana María Estudiante')
  await user.selectOptions(extensions, 'Chone')
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@ejemplo.edu.ec')
  await user.type(screen.getByLabelText('Contraseña personal'), 'SeguraClave2026')
  await user.click(screen.getByRole('button', {name:/Crear mi cuenta/}))
  expect(fake.signUp).toHaveBeenCalledWith(
    'ana@ejemplo.edu.ec','SeguraClave2026','Ana María Estudiante','Chone')
  expect(await screen.findByText(/Confirma tu correo electrónico/)).toBeInTheDocument()
})

it('no representa la clave de matrícula como contraseña personal', async () => {
  const user = userEvent.setup()
  render(<SecureCampus />)
  expect(await screen.findByText(/Tu contraseña personal es distinta de la clave/)).toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:'Crear cuenta'}))
  expect(screen.queryByLabelText(/Clave de matrícula de este curso/)).not.toBeInTheDocument()
})
