<style lang="scss" scoped>
  @import "./header.scss";
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Danh sách ảnh đã upload
      save-button(:fn="save")
    hr
</template>
<script>
  export default {
    methods: {
      async save() {

      }
    }
  }
</script>
