import Vue from 'vue'

import BsTable from './UI/Table.vue'
import FaLayers from '@client/components/UI/FaLayers'
import UploadBase from './UI/UploadBase.vue'

const defaultComponents = {
  BsTable,
  FaLayers,
  UploadBase
}
Object.entries(defaultComponents).forEach(([key, value]) => {
  Vue.component(key, value)
})

export { default as DateTimePicker } from './UI/bs-date-time-picker.vue'
export { default as ProductSelector } from './product-selector.vue'
export { default as Pagination } from './pagination.vue'
export { default as TimeDiffSelector } from './time-diff-selector.vue'
