import { escapeXml, stamp } from '../services/files.ts'
import { choice, jsonText, list, record, text, unique } from './validation.ts'

export const kinds = ['bar', 'line'] as const
export const tones = ['blue', 'clay', 'teal'] as const
export const colors = { blue: '#356ab2', clay: '#a45e42', teal: '#28766e' }
export interface Row {
  id: string
  label: string
  value: number
}
export interface Workspace {
  version: 1
  name: string
  caption: string
  unit: string
  kind: (typeof kinds)[number]
  tone: (typeof tones)[number]
  rows: Row[]
}
export const sample: Workspace = {
  version: 1,
  name: 'A little library, a growing audience',
  unit: 'visits',
  kind: 'bar',
  tone: 'blue',
  caption:
    'Monthly visits to our neighborhood reading corner. The spring reading series brought more neighbors through the door.',
  rows: [
    { id: 'point-1', label: 'January', value: 28 },
    { id: 'point-2', label: 'February', value: 35 },
    { id: 'point-3', label: 'March', value: 47 },
    { id: 'point-4', label: 'April', value: 64 },
    { id: 'point-5', label: 'May', value: 78 },
    { id: 'point-6', label: 'June', value: 71 },
  ],
}
function number(value: unknown) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < -1000 ||
    value > 10000 ||
    Math.abs(value * 100 - Math.round(value * 100)) > 1e-7
  )
    throw new Error('Values must be numbers from -1,000 to 10,000 with at most two decimal places.')
  return value
}
export function decimal(value: string) {
  if (!/^[+-]?(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(value.trim()))
    throw new Error(
      'Enter a decimal number; blank values, exponents, and formulas are not accepted.',
    )
  return number(Number(value.trim()))
}
export function parseWorkspace(value: unknown): Workspace {
  const raw = record(value, 'Workspace')
  if (raw.version !== 1) throw new Error('Unsupported workspace version.')
  const rows = list(raw.rows, 'Data points', 12).map((value): Row => {
    const row = record(value, 'Data point'),
      id = text(row.id, 'Point ID', 40)
    if (!/^[a-zA-Z0-9_-]+$/.test(id))
      throw new Error('Point IDs must contain letters, numbers, hyphens, or underscores.')
    return { id, label: text(row.label, 'Point label', 20), value: number(row.value) }
  })
  if (!rows.length) throw new Error('Include at least one data point.')
  unique(
    rows.map((row) => row.id),
    'Point IDs',
  )
  return {
    version: 1,
    name: text(raw.name, 'Chart title', 80),
    caption: text(raw.caption, 'Caption', 320, true),
    unit: text(raw.unit, 'Unit', 30, true),
    kind: choice(raw.kind, 'Chart kind', kinds),
    tone: choice(raw.tone, 'Chart tone', tones),
    rows,
  }
}
export function importWorkspace(source: string) {
  return parseWorkspace(jsonText(source))
}
export function workspaceMarker(workspace: Workspace) {
  return stamp('CT', parseWorkspace(workspace))
}
export function exportWorkspace(workspace: Workspace) {
  const valid = parseWorkspace(workspace)
  return JSON.stringify(
    {
      ...valid,
      provenance: {
        project: 'vue-chart-caption-studio',
        author: 'CodeSculptor',
        marker: workspaceMarker(valid),
      },
    },
    null,
    2,
  )
}

export function parseCsv(source: string): Row[] {
  if (source.length > 20000) throw new Error('CSV exceeds 20,000 characters.')
  const input = source.replace(/^\uFEFF/, ''),
    rows: string[][] = []
  let row: string[] = [],
    cell = '',
    quoted = false,
    closed = false
  function field() {
    row.push(cell)
    cell = ''
    closed = false
  }
  function line() {
    field()
    if (row.length !== 1 || row[0] !== '') rows.push(row)
    row = []
  }
  for (let index = 0; index < input.length; index++) {
    const char = input[index]!
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          cell += '"'
          index++
        } else {
          quoted = false
          closed = true
        }
      } else cell += char
      continue
    }
    if (char === ',') {
      field()
      continue
    }
    if (char === '\n' || char === '\r') {
      line()
      if (char === '\r' && input[index + 1] === '\n') index++
      continue
    }
    if (closed) {
      if (char === ' ' || char === '\t') continue
      throw new Error('Only a delimiter may follow a quoted CSV cell.')
    }
    if (char === '"') {
      if (cell) throw new Error('A quoted CSV cell must begin with a quote.')
      quoted = true
    } else cell += char
  }
  if (quoted) throw new Error('A quoted CSV cell is not closed.')
  if (cell || row.length || closed) line()
  const header = rows.shift()
  if (
    !header ||
    header.length !== 2 ||
    header[0]!.trim().toLowerCase() !== 'label' ||
    header[1]!.trim().toLowerCase() !== 'value'
  )
    throw new Error('CSV needs exactly two columns: label,value.')
  if (!rows.length || rows.length > 12) throw new Error('CSV needs 1–12 data rows.')
  return rows.map((cells, index) => {
    if (cells.length !== 2) throw new Error(`CSV row ${index + 2} needs two cells.`)
    return {
      id: `point-${index + 1}`,
      label: text(cells[0], 'Point label', 20),
      value: decimal(cells[1]!),
    }
  })
}
export function exportCsv(workspace: Workspace) {
  const valid = parseWorkspace(workspace),
    cell = (value: string) => '"' + value.replace(/"/g, '""') + '"'
  return (
    'label,value\r\n' +
    valid.rows.map((row) => `${cell(row.label)},${row.value}`).join('\r\n') +
    '\r\n'
  )
}
export function geometry(workspace: Workspace) {
  const min = Math.min(0, ...workspace.rows.map((row) => row.value)),
    highest = Math.max(0, ...workspace.rows.map((row) => row.value)),
    max = highest === min ? min + 1 : highest
  const left = 60,
    top = 30,
    width = 600,
    height = 250,
    step = width / workspace.rows.length
  const y = (value: number) => top + ((max - value) / (max - min)) * height
  return {
    left,
    top,
    width,
    height,
    step,
    zero: y(0),
    ticks: Array.from({ length: 5 }, (_, index) => ({
      value: max - ((max - min) * index) / 4,
      y: top + (height * index) / 4,
    })),
    points: workspace.rows.map((row, index) => ({
      ...row,
      x: left + step * (index + 0.5),
      y: y(row.value),
      barY: Math.min(y(row.value), y(0)),
      barHeight: Math.abs(y(row.value) - y(0)),
      barWidth: step * 0.6,
    })),
  }
}
export function formatMetric(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}
export function formatValue(value: number) {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value)
}
export function fitText(value: string, size: number, available: number) {
  return Math.max(1, Math.min(available, value.length * size * 0.55))
}
export function exportSvg(workspace: Workspace) {
  const valid = parseWorkspace(workspace),
    plot = geometry(valid),
    color = colors[valid.tone],
    marker = workspaceMarker(valid)
  const grids = plot.ticks
    .map(
      (tick) =>
        `<path d="M60 ${tick.y}H660" stroke="#dce3ec"/><text x="48" y="${tick.y + 4}" text-anchor="end" font-size="11" fill="#6a6572">${formatValue(tick.value)}</text>`,
    )
    .join('')
  const labels = plot.points
    .map(
      (point) =>
        `<text x="${point.x}" y="310" text-anchor="middle" font-size="12" fill="#6a6572" textLength="${fitText(point.label, 12, plot.step * 0.84)}" lengthAdjust="spacingAndGlyphs">${escapeXml(point.label)}</text>`,
    )
    .join('')
  const art =
    valid.kind === 'bar'
      ? plot.points
          .map(
            (point) =>
              `<rect x="${point.x - point.barWidth / 2}" y="${point.barY}" width="${point.barWidth}" height="${Math.max(point.barHeight, 0.6)}" rx="4" fill="${color}"/>`,
          )
          .join('')
      : `<polyline points="${plot.points.map((point) => `${point.x},${point.y}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>` +
        plot.points
          .map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${color}"/>`)
          .join('')
  const captionLines = valid.caption.match(/[\s\S]{1,80}/g) ?? []
  const caption = captionLines
    .map(
      (line, index) =>
        `<text x="60" y="${421 + index * 19}" font-size="13" fill="#6a6572" textLength="${fitText(line, 13, 600)}" lengthAdjust="spacingAndGlyphs">${escapeXml(line)}</text>`,
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="530" viewBox="0 0 720 530" role="img" aria-labelledby="title description"><title id="title">${escapeXml(valid.name)}</title><desc id="description">${escapeXml(valid.caption)} ${escapeXml(valid.rows.map((row) => `${row.label}: ${row.value} ${valid.unit}`).join('; '))}</desc><metadata>${escapeXml(JSON.stringify({ project: 'vue-chart-caption-studio', author: 'CodeSculptor', marker }))}</metadata><rect width="720" height="530" fill="#fff"/><g font-family="sans-serif"><text x="60" y="38" font-size="23" font-weight="700" fill="#292632" textLength="${fitText(valid.name, 23, 600)}" lengthAdjust="spacingAndGlyphs">${escapeXml(valid.name)}</text><text x="60" y="62" font-size="12" fill="#6a6572">${escapeXml(valid.unit)}</text><g transform="translate(0 65)">${grids}${art}<path d="M60 ${plot.zero}H660" stroke="#888d99"/>${labels}</g>${caption}<text x="60" y="509" font-size="11" fill="#6a6572">${marker} · CodeSculptor</text></g></svg>`
}
