import Vue from 'vue'

import BsTable from './UI/Table.vue'

const defaultComponents = {
  BsTable
}
Object.entries(defaultComponents).forEach(([key, value]) => {
  Vue.component(key, value)
})

export { default as DateTimePicker } from './UI/bs-date-time-picker.vue'
export { default as ProductSelector } from './product-selector.vue'
export { default as Pagination } from './pagination.vue'
export { default as TimeDiffSelector } from './time-diff-selector.vue'
