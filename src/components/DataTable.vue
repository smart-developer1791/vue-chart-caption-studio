<script setup lang="ts" generic="T extends { id: string }">
defineProps<{
  rows: readonly T[]
  columns: readonly { key: keyof T; label: string }[]
  label: string
}>()
defineSlots<{
  cell(props: {
    row: T
    column: { key: keyof T; label: string }
    value: T[keyof T]
    index: number
  }): unknown
  actions(props: { row: T; index: number }): unknown
}>()
</script>
<template>
  <div
    class="h-80 overflow-auto rounded-xl border border-line"
    tabindex="0"
    role="region"
    :aria-label="label"
    data-ui="data-table"
  >
    <table class="w-full min-w-[340px] border-collapse text-left text-xs">
      <thead class="sticky top-0 z-10 bg-background">
        <tr>
          <th
            v-for="column in columns"
            :key="String(column.key)"
            class="border-b border-line px-3 py-3 font-semibold"
            scope="col"
          >
            {{ column.label }}
          </th>
          <th class="w-14 border-b border-line px-2 py-3" scope="col">
            <span class="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="row.id">
          <td
            v-for="column in columns"
            :key="String(column.key)"
            class="border-b border-line px-3 py-2"
          >
            <slot name="cell" :row="row" :column="column" :value="row[column.key]" :index="index">{{
              row[column.key]
            }}</slot>
          </td>
          <td class="border-b border-line px-2 py-2">
            <slot name="actions" :row="row" :index="index" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
