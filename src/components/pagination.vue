<style lang="scss"></style>
<template lang="pug">
  .pagination-component
    slot(:data="paginatedData_")
    ul.pagination
      li.page-item(v-for="i in pageRange_", :class="{'active': i === pageCurrent_}")
        a.page-link(@click="pageCurrent=i")
</template>
<script>
import range from 'lodash/range'

export default {
  props: {
    data: {
      type: Array,
      required: true
    },
    pageCount: {
      type: Number,
      default: -1
    },
    perPage: {
      type: Number,
      default: 10
    }
  },
  data() {
    return {
      pageCurrent_: 1
    }
  },
  computed: {
    pageCount_() {
      return this.pageCount < 0
        ? Math.floor(this.data.length / this.perPage)
        : this.pageCount
    },
    firstPageNum_() {},
    lastPageNum_() {},
    pageRange_() {
      return range(this.firstPageNum_, this.lastPageNum_)
    },
    paginatedData_() {
      const { pageCurrent_: p, data, perPage } = this,
        [first, last] = [(p - 1) * perPage, p * perPage - 1]
      return data.slice(first, last)
    }
  }
}
</script>
