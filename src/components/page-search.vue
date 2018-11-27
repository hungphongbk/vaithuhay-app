<style lang="scss" module></style>
<template lang="pug">
  .form-inline
    label.sr-only Tìm kiếm
    input.form-control.form-control-lg.w-50(:placeholder="title", v-model="keyword", @keyup.enter="doSearch")
    small.text-muted.ml-3(v-if="keyword.length>0") Nhấn Enter để tìm kiếm
</template>
<script>
import debounce from 'lodash/debounce'

export default {
  props: {
    title: {
      type: String,
      required: true
    }
  },
  data: () => ({
    keyword: '',
    value: ''
  }),
  methods: {
    doSearch: function() {
      this.$emit('input', this.keyword)
    }
  }
}
</script>
