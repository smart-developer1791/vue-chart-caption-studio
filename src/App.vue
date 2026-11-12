<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppDialog from './components/AppDialog.vue'
import AppIcon from './components/AppIcon.vue'
import ChartPreview from './components/ChartPreview.vue'
import DataExchange from './components/DataExchange.vue'
import DataTable from './components/DataTable.vue'
import StudioHeader from './components/StudioHeader.vue'
import {
  decimal,
  exportCsv,
  exportSvg,
  exportWorkspace,
  formatMetric,
  formatValue,
  importWorkspace,
  kinds,
  parseCsv,
  parseWorkspace,
  sample,
  tones,
  workspaceMarker,
  type Workspace,
} from './domain/chart'
import { useDraft } from './services/draft'
import { clone, download } from './services/files'

const { draft: workspace, storageStatus } = useDraft(
  'vue-chart-caption-studio:v1',
  clone(sample),
  parseWorkspace,
)
function editable(value: Workspace) {
  return { ...clone(value), rows: value.rows.map((row) => ({ ...row, value: String(row.value) })) }
}
const editor = ref(editable(workspace.value)),
  error = ref(''),
  message = ref('A small set of numbers can tell a useful story.')
const columns = [
  { key: 'label', label: 'Label' },
  { key: 'value', label: 'Value' },
] as const
const marker = computed(() => workspaceMarker(workspace.value)),
  total = computed(() => workspace.value.rows.reduce((sum, row) => sum + row.value, 0)),
  maximum = computed(() => Math.max(...workspace.value.rows.map((row) => row.value)))
const importOpen = ref(false),
  importText = ref(''),
  importError = ref(''),
  csvOpen = ref(false),
  csvText = ref(''),
  csvError = ref(''),
  restoreOpen = ref(false),
  guideOpen = ref(false)
const removeOpen = ref(false),
  removeId = ref('')
watch(
  editor,
  (value) => {
    try {
      workspace.value = parseWorkspace({
        ...value,
        rows: value.rows.map((row) => ({ ...row, value: decimal(row.value) })),
      })
      error.value = ''
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : 'Invalid chart.'
    }
  },
  { deep: true },
)
function rowEditor(id: string) {
  return editor.value.rows.find((row) => row.id === id)!
}
function load(value: Workspace) {
  workspace.value = parseWorkspace(value)
  editor.value = editable(workspace.value)
  error.value = ''
}
function add() {
  let serial = 1
  while (workspace.value.rows.some((row) => row.id === `point-${serial}`)) serial++
  load({
    ...workspace.value,
    rows: [...workspace.value.rows, { id: `point-${serial}`, label: `Point ${serial}`, value: 0 }],
  })
  message.value = 'A new point is ready to edit.'
}
function requestRemove(id: string) {
  removeId.value = id
  removeOpen.value = true
}
function remove() {
  load({
    ...workspace.value,
    rows: workspace.value.rows.filter((row) => row.id !== removeId.value),
  })
  removeOpen.value = false
  message.value = 'Point removed from this chart.'
}
function openImport() {
  importText.value = exportWorkspace(workspace.value)
  importError.value = ''
  importOpen.value = true
}
function applyImport() {
  try {
    load(importWorkspace(importText.value))
    importOpen.value = false
    message.value = 'Workspace imported and validated.'
  } catch (reason) {
    importError.value = reason instanceof Error ? reason.message : 'Invalid workspace.'
  }
}
function openCsv() {
  csvText.value = exportCsv(workspace.value)
  csvError.value = ''
  csvOpen.value = true
}
function applyCsv() {
  try {
    load(parseWorkspace({ ...workspace.value, rows: parseCsv(csvText.value) }))
    csvOpen.value = false
    message.value = 'CSV imported. Chart settings and caption were kept.'
  } catch (reason) {
    csvError.value = reason instanceof Error ? reason.message : 'Invalid CSV.'
  }
}
function restore() {
  load(clone(sample))
  restoreOpen.value = false
  message.value = 'The original library chart is restored.'
}
</script>
<template>
  <div class="mx-auto max-w-[1450px]" data-project="vue-chart-caption-studio">
    <StudioHeader
      title="Chart Caption Studio"
      subtitle="Numbers with a little more context"
      code="CT"
      ><button class="bg-surface hover:bg-soft" @click="openImport">
        <AppIcon name="upload" />Import</button
      ><button
        class="bg-surface hover:bg-soft"
        @click="download(`${marker}.json`, exportWorkspace(workspace))"
      >
        <AppIcon name="download" />JSON</button
      ><button
        class="bg-accent text-on-accent hover:brightness-110"
        :disabled="Boolean(error)"
        @click="download(`${marker}.svg`, exportSvg(workspace), 'image/svg+xml')"
      >
        <AppIcon name="download" />Export SVG
      </button></StudioHeader
    >
    <main class="px-5 py-8 md:px-8">
      <div class="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div class="max-w-xl">
          <p class="mb-3 text-xs font-bold uppercase tracking-[.18em] text-accent">
            The story in the data / 01
          </p>
          <h1 class="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            A clearer picture.<br />A better caption.
          </h1>
          <p class="mt-4 leading-relaxed text-muted">
            Turn a small dataset into a chart people can understand, with the context they need to
            read it.
          </p>
        </div>
        <div class="flex gap-6 rounded-xl border border-line bg-surface px-5 py-4">
          <div>
            <span class="block font-display text-2xl font-semibold">{{
              workspace.rows.length
            }}</span
            ><span class="text-xs text-muted">data points</span>
          </div>
          <div>
            <span class="block font-display text-2xl font-semibold" :title="formatValue(total)">{{
              formatMetric(total)
            }}</span
            ><span class="text-xs text-muted">total</span>
          </div>
          <div>
            <span class="block font-display text-2xl font-semibold" :title="formatValue(maximum)">{{
              formatMetric(maximum)
            }}</span
            ><span class="text-xs text-muted">highest value</span>
          </div>
        </div>
      </div>
      <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]" data-ui="workspace">
        <section class="min-w-0 space-y-5" aria-label="Chart and caption preview">
          <div class="rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <div class="mb-4 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-semibold">{{ workspace.name }}</h2>
                <p class="mt-1 truncate text-xs text-muted" :title="workspace.unit">
                  {{ workspace.unit || 'No unit label' }} ·
                  {{ workspace.kind === 'bar' ? 'Bar chart' : 'Line chart' }}
                </p>
              </div>
              <span
                class="shrink-0 rounded-full bg-soft px-2 py-1 text-[10px] font-bold text-accent"
                >LIVE</span
              >
            </div>
            <ChartPreview :workspace="workspace" />
            <p class="mt-2 text-xs text-muted sm:hidden">
              Scroll the chart to see all data points.
            </p>
            <div
              class="mt-4 h-32 overflow-y-auto rounded-xl bg-soft p-4"
              role="region"
              aria-label="Chart caption"
              tabindex="0"
            >
              <p class="mb-2 text-[10px] font-bold uppercase tracking-wider text-accent">
                The caption
              </p>
              <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">
                {{ workspace.caption || 'Add a caption to give the numbers their context.' }}
              </p>
            </div>
          </div>
          <div class="rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <h2 class="text-lg font-semibold">What should people know?</h2>
            <p class="mt-1 mb-5 text-xs text-muted">
              A title names the story; a caption helps people interpret it.
            </p>
            <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
              <label>Chart title<input v-model="editor.name" maxlength="80" required /></label
              ><label
                >Unit label<input v-model="editor.unit" maxlength="30" placeholder="visits, hours…"
              /></label>
            </div>
            <label class="mt-4"
              >Caption<textarea
                v-model="editor.caption"
                maxlength="320"
                class="h-24 resize-y"
                placeholder="Describe the data, its source, or an important exception."
              />
            </label>
            <div class="mt-4 grid grid-cols-2 gap-4">
              <label
                >Chart type<select v-model="editor.kind">
                  <option v-for="kind in kinds" :key="kind" :value="kind">{{ kind }}</option>
                </select></label
              ><label
                >Chart tone<select v-model="editor.tone">
                  <option v-for="tone in tones" :key="tone" :value="tone">{{ tone }}</option>
                </select></label
              >
            </div>
          </div>
        </section>
        <aside class="min-w-0 rounded-2xl border border-line bg-surface p-5">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">The data notebook</h2>
            <span class="text-xs text-muted">{{ workspace.rows.length }} / 12</span>
          </div>
          <p class="mt-2 mb-5 text-xs leading-relaxed text-muted">
            Values accept two decimal places, including negatives. Valid edits save automatically.
          </p>
          <DataTable
            :rows="workspace.rows"
            :columns="columns"
            label="Editable chart data, scroll for all columns"
            ><template #cell="{ row, column, index, value }"
              ><input
                v-if="column.key === 'label'"
                v-model="rowEditor(row.id).label"
                class="mt-0! min-w-36!"
                maxlength="20"
                :aria-label="`Row ${index + 1} label`"
                :placeholder="String(value)" /><input
                v-else
                v-model="rowEditor(row.id).value"
                class="mt-0! min-w-24!"
                inputmode="decimal"
                maxlength="16"
                :aria-label="`Row ${index + 1} value`"
                :placeholder="String(value)" /></template
            ><template #actions="{ row, index }"
              ><button
                class="min-h-8! px-2! py-1! text-danger hover:bg-danger/5"
                :aria-label="`Remove row ${index + 1}`"
                :disabled="workspace.rows.length === 1 || Boolean(error)"
                @click="requestRemove(row.id)"
              >
                <AppIcon name="trash" /></button></template
          ></DataTable>
          <button
            class="mt-4 w-full bg-soft text-accent hover:bg-accent/10"
            :disabled="workspace.rows.length >= 12 || Boolean(error)"
            @click="add"
          >
            <AppIcon name="plus" />Add data point
          </button>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button class="hover:bg-soft" @click="openCsv">
              <AppIcon name="upload" />Import CSV</button
            ><button
              class="hover:bg-soft"
              @click="download(`${marker}.csv`, exportCsv(workspace), 'text/csv')"
            >
              <AppIcon name="download" />CSV
            </button>
          </div>
          <p
            class="mt-4 min-h-16 text-xs leading-relaxed"
            :class="error ? 'text-danger' : 'text-muted'"
            role="status"
            data-ui="draft-status"
          >
            {{
              error ||
              'The preview and JSON reflect the last valid chart. SVG export is available when every edit is valid.'
            }}
          </p>
          <hr class="my-5 border-line" />
          <button class="w-full border-0! text-muted hover:bg-soft" @click="restoreOpen = true">
            <AppIcon name="reset" />Restore sample
          </button>
          <p class="mt-4 rounded-xl bg-soft p-3 text-xs leading-relaxed text-muted">
            CSV exchanges only label/value rows. JSON keeps the full chart, caption, and appearance.
          </p>
        </aside>
      </div>
      <p
        class="mt-4 min-h-10 rounded-lg border border-line bg-soft px-4 py-3 text-xs leading-relaxed text-muted"
        role="status"
        data-ui="status"
      >
        {{ message }}
      </p>
    </main>
    <footer
      class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-5 text-xs text-muted md:px-8"
    >
      <span>Made with Vue · <span class="text-accent">CodeSculptor</span></span
      ><span role="status">{{ storageStatus }}</span
      ><button
        class="min-h-8! border-0! px-0! text-xs! text-accent hover:underline"
        @click="guideOpen = true"
      >
        {{ marker }} <AppIcon name="info" />
      </button>
    </footer>
    <DataExchange
      v-model="importOpen"
      v-model:text="importText"
      :error="importError"
      @apply="applyImport"
    />
    <AppDialog v-model="removeOpen" title="Remove this data point?"
      ><p class="leading-relaxed text-muted">
        Remove {{ workspace.rows.find((row) => row.id === removeId)?.label }} from the chart?
      </p>
      <div class="mt-6 flex justify-end gap-2">
        <button @click="removeOpen = false">Cancel</button
        ><button class="bg-danger text-white" @click="remove">Remove point</button>
      </div></AppDialog
    >
    <AppDialog v-model="csvOpen" title="Import CSV data"
      ><p class="mb-4 text-sm leading-relaxed text-muted">
        Use exactly two columns: label,value. Quoted cells may contain commas, newlines, or escaped
        quotes. This replaces the current data points.
      </p>
      <label
        >Data CSV<textarea
          v-model="csvText"
          class="h-64 resize-y font-mono text-xs!"
          maxlength="20000"
          spellcheck="false"
        />
      </label>
      <p class="mt-3 min-h-10 text-xs text-danger" role="alert">{{ csvError }}</p>
      <div class="mt-4 flex justify-end gap-2">
        <button @click="csvOpen = false">Cancel</button
        ><button class="bg-accent text-on-accent" @click="applyCsv">Apply CSV</button>
      </div></AppDialog
    >
    <AppDialog v-model="restoreOpen" title="Restore the sample chart?"
      ><p class="leading-relaxed text-muted">
        This replaces the chart and pending edits with the original library sample. Export your
        workspace first if you want to keep it.
      </p>
      <div class="mt-6 flex justify-end gap-2">
        <button @click="restoreOpen = false">Cancel</button
        ><button class="bg-accent text-on-accent" @click="restore">Restore sample</button>
      </div></AppDialog
    >
    <AppDialog v-model="guideOpen" title="About this workspace"
      ><p class="leading-relaxed text-muted">
        The CT stamp identifies the validated chart. It appears in JSON provenance, standalone SVG
        metadata, and filenames. It is an identity aid, not a security signature.
      </p>
      <p class="mt-4 leading-relaxed text-muted">
        The data table is a generic Vue SFC: its row type determines column keys and the typed
        cell-slot payload. The parent owns input parsing and the table supplies the reusable
        structure. Negative values share a visible zero baseline; line charts follow the displayed
        row order.
      </p>
      <a class="mt-5 inline-block text-accent underline" href="/sample-workspace.json" download
        >Download the sample workspace</a
      ></AppDialog
    >
  </div>
</template>
