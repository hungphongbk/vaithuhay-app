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
  data() {
    return {
      fields: [
        { key: 'id', label: 'ID' },
        { key: 'key', label: 'Key' },
        {
          key: 'value',
          label: 'Value',
          transform: item => ({
            render: h => <div class="btn btn-secondary btn-sm">Xem giá trị</div>
          })
        },
        {
          key: 'action',
          label: '',
          transform: item => ({
            render: h => (
              <div
                class="btn btn-warning btn-sm"
                onClick={() => this.remove(item)}
              >
                Xoá
              </div>
            )
          })
        }
      ]
    }
  },
  computed: {
    metafields() {
      return this.$store.state.metafields.list
    }
  },
  methods: {
    remove(item) {
      this.$socket.emit('deleteMetafield', { resource: null, id: item.id })
    }
  }
}
</script>
