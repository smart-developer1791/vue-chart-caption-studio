import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const key = 'vue-chart-caption-studio:v1'
test('typed table slots edit numeric data, preserve last-valid values, and support signed plots', async ({
  page,
}) => {
  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'Row 1 value', exact: true })
  await input.fill('-12.5')
  await expect
    .poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).rows[0].value, key))
    .toBe(-12.5)
  const valid = await page.evaluate((key) => localStorage.getItem(key), key)
  await input.fill('1e3')
  await expect(page.locator('[data-ui="draft-status"]')).toContainText('exponents')
  await expect(page.getByRole('button', { name: 'Export SVG', exact: true })).toBeDisabled()
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(valid)
  await input.fill('15.25')
  await expect(page.getByRole('button', { name: 'Export SVG', exact: true })).toBeEnabled()
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Row 1 value', exact: true })).toHaveValue('15.25')
})
test('quoted CSV imports atomically and CSV export keeps rows readable', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Import CSV', exact: true }).click()
  await page
    .getByLabel('Data CSV', { exact: true })
    .fill('label,value\n"Tea, books",-2.5\n"The ""new"" room",4.25')
  await page.getByRole('button', { name: 'Apply CSV', exact: true }).click()
  await expect(page.locator('[data-point]')).toHaveCount(2)
  await expect(page.getByRole('textbox', { name: 'Row 1 label', exact: true })).toHaveValue(
    'Tea, books',
  )
  const valid = await page.evaluate((key) => localStorage.getItem(key), key)
  await page.getByRole('button', { name: 'Import CSV', exact: true }).click()
  await page.getByLabel('Data CSV', { exact: true }).fill('label,value\nBad,=1+2')
  await page.getByRole('button', { name: 'Apply CSV', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('formulas')
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(valid)
  await page.keyboard.press('Escape')
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'CSV', exact: true }).click()
  expect(await readFile((await (await pending).path())!, 'utf8')).toContain('"Tea, books",-2.5\r\n')
})
test('mode changes keep the frame stable and confirmed deletion respects the one-row minimum', async ({
  page,
}) => {
  await page.goto('/')
  const frame = page.locator('[data-ui="chart-frame"]'),
    before = await frame.boundingBox()
  await page.getByRole('combobox', { name: 'Chart type', exact: true }).selectOption('line')
  await expect(page.locator('[data-ui="chart"] polyline')).toHaveCount(1)
  expect(await frame.boundingBox()).toEqual(before)
  await page.getByRole('button', { name: 'Add data point', exact: true }).click()
  await expect(page.locator('[data-point]')).toHaveCount(7)
  await page.getByRole('button', { name: 'Remove row 7', exact: true }).click()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.locator('[data-point]')).toHaveCount(7)
  await page.getByRole('button', { name: 'Remove row 7', exact: true }).click()
  await page.getByRole('button', { name: 'Remove point', exact: true }).click()
  await expect(page.locator('[data-point]')).toHaveCount(6)
})
test('SVG downloads are self-contained XML and long data stays inside the narrow interface', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.goto('/')
  const frame = page.locator('[data-ui="chart-frame"]')
  expect(await frame.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
  await frame.focus()
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => frame.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
  await page.getByRole('textbox', { name: 'Chart title', exact: true }).fill('W'.repeat(80))
  await page.getByRole('textbox', { name: 'Caption', exact: true }).fill('W'.repeat(320))
  await page.getByRole('textbox', { name: 'Unit label', exact: true }).fill('W'.repeat(30))
  await page.getByRole('textbox', { name: 'Row 1 value', exact: true }).fill('9999.99')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export SVG', exact: true }).click()
  const download = await pending,
    svg = await readFile((await download.path())!, 'utf8')
  const parsed = await page.evaluate((svg) => {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
    return {
      errors: doc.querySelectorAll('parsererror').length,
      description: doc.querySelector('desc')?.textContent,
      metadata: doc.querySelector('metadata')?.textContent,
      classes: doc.querySelectorAll('[class]').length,
    }
  }, svg)
  expect(parsed.errors).toBe(0)
  expect(parsed.classes).toBe(0)
  expect(parsed.description).toContain('W'.repeat(320))
  expect(JSON.parse(parsed.metadata!).marker + '.svg').toBe(download.suggestedFilename())
})
