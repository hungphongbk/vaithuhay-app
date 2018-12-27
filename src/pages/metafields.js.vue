<style lang="scss" module></style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Metafields
    page-tabs
      page-tab#shop(title="Shop")
        bs-table(:fields="fields" :dataSource="metafields")
</template>
<script>
export default {
  name: 'Metafields',
  data: () => ({
    fields: [
      { key: 'id', label: 'ID' },
      { key: 'key', label: 'Key' },
      {
        key: 'value',
        label: 'Value',
        transform: item => ({
          render: h => <div class="btn btn-secondary btn-sm">Xem giá trị</div>
        })
      }
    ]
  }),
  computed: {
    metafields() {
      return this.$store.state.metafields.list
    }
  }
}
</script>
