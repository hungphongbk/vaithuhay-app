<template lang="pug">
  div.media
    img.mr-3(src="../../images/icon-collections.png")
    .media-body
      h6.card-title Slider danh mục
        i(v-if="data.collections.length===0") &nbsp;(trống)
      .btn.btn-primary.btn-sm(@click="showCollectionSelector = true") Chỉnh sửa
    modal(v-if="showCollectionSelector" title="Chọn danh mục sản phẩm" @dismiss="dismiss")
      .modal-body
        collection-selector(v-model="tmpCollections")
      .modal-footer
        .btn.btn-success(@click="ok") OK
</template>
<script>
import Modal from '../../components/modal.vue'
import CollectionSelector from '../../components/collection-selector.vue'
export default {
  name: 'PageSectionItemCollectionSlider',
  components: { Modal, CollectionSelector },
  props: {
    data: {
      type: Object,
      default: () => ({
        collections: [],
        maxItems: 20
      })
    }
  },
  data: () => ({
    showCollectionSelector: false,
    tmpCollections: []
  }),
  methods: {
    reset() {
      this.tmpCollections = this.data.collections
    },
    dismiss() {
      this.showCollectionSelector = false
      this.reset()
    },
    ok() {
      this.showCollectionSelector = false
      this.data.collections = this.tmpCollections
    }
  },
  mounted() {
    this.$emit('update', this.data)
    this.reset()
  }
}
</script>

<style module></style>
