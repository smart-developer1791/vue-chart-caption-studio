import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  decimal,
  exportCsv,
  exportSvg,
  exportWorkspace,
  geometry,
  importWorkspace,
  parseCsv,
  parseWorkspace,
  sample,
  workspaceMarker,
} from '../src/domain/chart.ts'

test('bundled samples, JSON, CSV, and provenance round-trip', () => {
  assert.deepEqual(
    importWorkspace(
      readFileSync(new URL('../public/sample-workspace.json', import.meta.url), 'utf8'),
    ),
    sample,
  )
  assert.deepEqual(
    parseCsv(readFileSync(new URL('../public/sample-data.csv', import.meta.url), 'utf8')),
    sample.rows,
  )
  assert.deepEqual(importWorkspace(exportWorkspace(sample)), sample)
  assert.deepEqual(parseCsv(exportCsv(sample)), sample.rows)
  assert.equal(JSON.parse(exportWorkspace(sample)).provenance.marker, workspaceMarker(sample))
  assert.match(workspaceMarker(sample), /^CT-[A-F0-9]{8}$/)
})
test('CSV handles BOM, quoted commas, escaped quotes, multiline labels, and CRLF', () => {
  const rows = parseCsv(
    '\uFEFFlabel,value\r\n"Tea, books",-2.5\r\n"The ""new"" room",4.25\r\n"Two\nlines",0\r\n',
  )
  assert.deepEqual(
    rows.map(({ label, value }) => ({ label, value })),
    [
      { label: 'Tea, books', value: -2.5 },
      { label: 'The "new" room', value: 4.25 },
      { label: 'Two\nlines', value: 0 },
    ],
  )
  assert.deepEqual(parseCsv(exportCsv({ ...sample, rows })), rows)
})
test('CSV rejects malformed quotes, excess columns, empty datasets, and numeric coercion', () => {
  for (const source of [
    'label,value\n"open,3',
    'label,value,extra\na,1,2',
    'label,value\na,1,2',
    'label,value\n',
    'label,value\na,',
    'label,value\na,=1+2',
    'label,value\na,1e3',
  ])
    assert.throws(() => parseCsv(source))
  for (const value of ['', 'Infinity', '0x10', '1e3', '1.234', '10001'])
    assert.throws(() => decimal(value))
  assert.equal(decimal(' -.25 '), -0.25)
  assert.throws(() => parseCsv('x'.repeat(20001)), /20,000/)
})
test('JSON rejects enum arrays, nonfinite numbers, duplicate identities, and empty data', () => {
  for (const field of ['kind', 'tone'])
    for (const bad of [[sample[field as 'kind' | 'tone']], null, 1, true, {}])
      assert.throws(() => parseWorkspace({ ...sample, [field]: bad }))
  for (const value of ['1', null, NaN, Infinity, 1.234])
    assert.throws(() => parseWorkspace({ ...sample, rows: [{ ...sample.rows[0], value }] }))
  assert.throws(() => parseWorkspace({ ...sample, rows: [] }), /at least one/)
  assert.throws(
    () => parseWorkspace({ ...sample, rows: [sample.rows[0], sample.rows[0]] }),
    /unique/,
  )
  assert.throws(
    () => parseWorkspace({ ...sample, rows: Array(13).fill(sample.rows[0]) }),
    /at most 12/,
  )
})
test('signed and all-zero plots have a finite visible zero baseline', () => {
  const signed = geometry({
    ...sample,
    rows: [
      { id: 'a', label: 'Loss', value: -10 },
      { id: 'b', label: 'Gain', value: 20 },
    ],
  })
  assert.ok(signed.zero > signed.top && signed.zero < signed.top + signed.height)
  assert.ok(signed.points.every((point) => point.barHeight > 0))
  const zero = geometry({ ...sample, rows: [{ id: 'z', label: 'Zero', value: 0 }] })
  assert.ok(Number.isFinite(zero.zero))
  assert.equal(zero.points[0]!.barHeight, 0)
})
test('SVG contains complete escaped data/caption, bounded labels, and standalone provenance', () => {
  const chart = {
    ...sample,
    name: '<story> & numbers',
    caption: '<script>alert("x")</script>',
    rows: [{ id: 'a', label: '<Tea & books>', value: -2 }],
  }
  const svg = exportSvg(chart)
  assert.ok(svg.includes('&lt;story&gt; &amp; numbers'))
  assert.ok(svg.includes('&lt;Tea &amp; books&gt;'))
  assert.ok(!svg.includes('<script>'))
  assert.ok(!svg.includes('class='))
  assert.ok(svg.includes('textLength='))
  assert.ok(svg.includes(workspaceMarker(chart)))
  assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'))
})
