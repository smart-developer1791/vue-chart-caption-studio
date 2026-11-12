<script setup lang="ts">
import { computed, useId } from 'vue'
import { colors, fitText, formatValue, geometry, type Workspace } from '../domain/chart'
const props = defineProps<{ workspace: Workspace }>()
const plot = computed(() => geometry(props.workspace)),
  titleId = useId(),
  descId = useId()
</script>
<template>
  <div
    class="h-[350px] overflow-auto rounded-xl border border-line bg-surface p-3 focus-visible:outline-2 focus-visible:outline-accent sm:h-[400px]"
    tabindex="0"
    role="region"
    aria-label="Chart preview, scroll horizontally for all data points"
    data-ui="chart-frame"
  >
    <svg
      class="h-full w-full min-w-[640px] font-sans"
      viewBox="0 0 720 350"
      role="img"
      :aria-labelledby="`${titleId} ${descId}`"
      data-ui="chart"
    >
      <title :id="titleId">{{ workspace.name }}</title>
      <desc :id="descId">
        {{ workspace.caption }}
        {{ workspace.rows.map((row) => `${row.label}: ${row.value} ${workspace.unit}`).join('; ') }}
      </desc>
      <g v-for="tick in plot.ticks" :key="tick.y">
        <path :d="`M60 ${tick.y}H660`" class="stroke-line" />
        <text x="48" :y="tick.y + 4" text-anchor="end" class="fill-muted text-[11px]">
          {{ formatValue(tick.value) }}
        </text>
      </g>
      <template v-if="workspace.kind === 'bar'">
        <rect
          v-for="point in plot.points"
          :key="point.id"
          :x="point.x - point.barWidth / 2"
          :y="point.barY"
          :width="point.barWidth"
          :height="Math.max(point.barHeight, 0.6)"
          rx="4"
          :fill="colors[workspace.tone]"
          :data-point="point.id"
        />
      </template>
      <template v-else>
        <polyline
          :points="plot.points.map((point) => `${point.x},${point.y}`).join(' ')"
          fill="none"
          :stroke="colors[workspace.tone]"
          stroke-width="3"
        />
        <circle
          v-for="point in plot.points"
          :key="point.id"
          :cx="point.x"
          :cy="point.y"
          r="4"
          :fill="colors[workspace.tone]"
          :data-point="point.id"
        />
      </template>
      <path :d="`M60 ${plot.zero}H660`" class="stroke-muted" />
      <text
        v-for="point in plot.points"
        :key="point.id"
        :x="point.x"
        y="310"
        text-anchor="middle"
        class="fill-muted text-[12px]"
        :textLength="fitText(point.label, 12, plot.step * 0.84)"
        lengthAdjust="spacingAndGlyphs"
      >
        {{ point.label }}
      </text>
    </svg>
  </div>
</template>
