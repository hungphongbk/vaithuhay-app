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
  div.media(v-if="data")
    img.mr-3(src="../../images/icon-collections.png")
    .media-body
      h6.card-title.mb-1 Slider danh mục&nbsp;
        i(v-if="data.collections.length===0") (trống)
        .badge.badge-pill.badge-primary(v-else) {{data.collections.length}}
      small.mb-2.d-inline-block(:class="$style.categories" v-if="data.collections.length>0")
        span.text-primary(v-for="cat in categories") {{cat.title}}
      br
      .btn.btn-primary.btn-sm(@click="showCollectionSelector = true") Chỉnh sửa
      .btn.btn-secondary.btn-sm.ml-2(@click="()=>this.$refs.ui.show()") Giao diện
    modal(v-if="showCollectionSelector" title="Chọn danh mục sản phẩm" @dismiss="dismiss")
      .modal-body
        collection-selector(v-model="tmpCollections")
        br
        label Số sản phẩm tối đa hiển thị trên mỗi slide
        input.form-control(type="text" v-model="tmpMaxItems")
      .modal-footer
        .btn.btn-success(@click="ok") OK
    ui-settings(ref="ui" v-model="tmpUi")
</template>
<script>
import Modal from '../../components/modal.vue'
import CollectionSelector from '../../components/collection-selector.vue'
import UiSettings from './UISettings.vue'
import { mapState } from 'vuex'
export default {
  name: 'PageSectionItemCollectionSlider',
  components: { Modal, CollectionSelector, UiSettings },
  props: {
    data: {
      validator: val => typeof val === 'object' || val === null,
      required: true
    }
  },
  data: () => ({
    showCollectionSelector: false,
    tmpCollections: [],
    tmpMaxItems: 20,
    tmpUi: {}
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
      this.tmpMaxItems = this.data.maxItems
      this.tmpUi = this.data.ui || {}
    },
    dismiss() {
      this.showCollectionSelector = false
      this.reset()
    },
    ok() {
      this.showCollectionSelector = false
      this.data.collections = this.tmpCollections
      this.data.maxItems = this.tmpMaxItems
      this.data.ui = this.tmpUi || {}
      this.$emit('update', this.data)
    }
  },
  mounted() {
    if (!this.data)
      this.$emit('update', {
        collections: [],
        maxItems: 20
      })
    this.$nextTick(() => this.reset())
  }
}
</script>
