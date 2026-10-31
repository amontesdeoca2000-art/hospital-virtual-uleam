import { test, expect, type Page } from '@playwright/test'
async function navigate(page: Page, name: string) {
  if (await page.getByRole('button', { name: 'Abrir navegación' }).isVisible())
    await page.getByRole('button', { name: 'Abrir navegación' }).click()
  await page
    .getByRole('navigation')
    .getByRole('button', { name, exact: true })
    .click()
}
test('recorrido funcional, persistencia y respaldo', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'HOSPITAL VIRTUAL ULEAM', exact: true }),
  ).toBeVisible()
  await navigate(page, 'Mi recorrido académico')
  await page
    .getByRole('combobox', { name: 'Carrera', exact: true })
    .selectOption('fisioterapia')
  await page
    .getByRole('combobox', { name: 'Asignatura', exact: true })
    .selectOption('practicas')
  await page
    .getByRole('button', { name: 'Movimiento y valoración funcional' })
    .click()
  await page.getByRole('button', { name: 'Comenzar actividad' }).click()
  for (let i = 0; i < 3; i++) {
    await page.getByRole('radio').nth(1).check()
    await page.getByRole('button', { name: 'Confirmar decisión' }).click()
    await expect(page.getByRole('status')).toContainText('100/100')
    await page
      .getByRole('button', {
        name: i === 2 ? 'Ver resultado' : 'Siguiente decisión',
      })
      .click()
  }
  await expect(
    page.getByText('Intento guardado en este navegador.'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Volver a actividades' }).click()
  await navigate(page, 'Mis resultados')
  await expect(page.getByText('100/100').first()).toBeVisible()
  await page.reload()
  await navigate(page, 'Mis resultados')
  await expect(page.getByText('100/100').first()).toBeVisible()
  await navigate(page, 'Administración')
  await page.getByRole('button', { name: /^Carreras/ }).click()
  await page.getByRole('button', { name: 'Crear registro' }).click()
  await page.getByLabel('Nombre *', { exact: true }).fill('Carrera de prueba')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(
    page.getByText('Carrera de prueba', { exact: true }),
  ).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('respaldo.json')
  await page.getByRole('button', { name: 'Eliminar Carrera de prueba' }).click()
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click()
  await expect(
    page.getByText('Carrera de prueba', { exact: true }),
  ).toHaveCount(0)
  const path = await download.path()
  await page.locator('input[type=file]').setInputFiles(path!)
  await expect(page.getByRole('dialog')).toContainText(
    'Reemplazar contenido local',
  )
  await page.getByRole('button', { name: 'Confirmar importación' }).click()
  await expect(
    page.getByText('Carrera de prueba', { exact: true }),
  ).toBeVisible()
  expect(errors).toEqual([])
})
test('mapa, edición de casos, organigrama y pantalla sin desbordamiento', async ({
  page,
}) => {
  await page.goto('/')
  await page.screenshot({
    path: `test-results/inicio-${test.info().project.name}.png`,
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await navigate(page, 'Explorar el hospital')
  await page.getByRole('button', { name: /^02 Triaje/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Funciones del área')
  await page.getByRole('button', { name: 'Cerrar ventana' }).click()
  await navigate(page, 'Administración')
  await page.getByRole('button', { name: /Casos, actividades/ }).click()
  await page
    .getByRole('button', { name: 'Editar Primeros minutos en triaje' })
    .click()
  await page.getByLabel('Objetivo *').fill('Objetivo educativo actualizado')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByRole('status')).toContainText('Cambios guardados')
  await navigate(page, 'Equipo y organigrama')
  await expect(
    page.getByRole('heading', { name: 'Director general', exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
