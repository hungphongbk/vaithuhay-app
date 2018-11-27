<style lang="scss" scoped>
.item {
  display: inline-block;
}
</style>
<template lang="pug">
  div
    .btn.btn-primary.mb-2(@click="show=true") {{title}}
    br
    product-view(v-model="value")
    modal(v-if="show", title="Chọn sản phẩm", @dismiss="show=false")
      .modal-body
        product-selector(v-model="value")
      .modal-footer
        save-button.btn.btn-success(:fn="select")
</template>
<script>
import ProductSelector from './product-selector.vue'

export default {
  components: {
    ProductSelector,
    'product-view': {
      functional: true,
      render(h, { props, parent }) {
        const product = id => parent.products.find(p => p.id * 1 === id * 1)
        return props.value.map(id => (
          <p class="item mb-1 text-primary">{product(id).title}</p>
        ))
      }
    }
  },
  props: {
    title: {
      type: String,
      default: 'Chọn sản phẩm'
    },
    value: {
      required: true
    }
  },
  data() {
    return {
      show: false
    }
  },
  computed: {
    products() {
      return this.$store.state.products.products
    }
  },
  methods: {
    select() {
      this.$emit('input', this.value)
      this.show = false
    }
  }
}
</script>
