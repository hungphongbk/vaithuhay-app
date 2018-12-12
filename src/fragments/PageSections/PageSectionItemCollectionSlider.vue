<style lang="scss" module>
.categories span {
  padding: {
    left: 0.5rem;
    right: 0.5rem;
  }
  &:first-child {
    padding-left: 0;
  }
  &:last-child {
    padding-right: 0;
  }
  display: inline-block;
  position: relative;
  &:not(:last-child) {
    &:after {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      content: '';
      width: 1px;
      background: #8195b2;
      display: inline-block;
    }
  }
}
</style>
<template lang="pug">
  div.media
    img.mr-3(src="../../images/icon-collections.png")
    .media-body
      h6.card-title.mb-1 Slider danh mục
        i(v-if="data.collections.length===0") &nbsp;(trống)
      small.mb-2.d-inline-block(:class="$style.categories")
        span.text-primary(v-for="cat in categories") {{cat.title}}
      br
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
import { mapState } from 'vuex'
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
  computed: {
    categories() {
      return this.$store.state.categories.categories.filter(cat => {
        return this.data.collections.findIndex(i => i * 1 === cat.id * 1) >= 0
      })
    }
  },
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
    if (this.data.collections.length === 0) this.$emit('update', this.data)
    this.reset()
  }
}
</script>
