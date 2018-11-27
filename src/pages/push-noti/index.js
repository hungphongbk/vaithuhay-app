import General from './message-template-general.vue'
import Product from './message-template-product.vue'

const templates = {
  general: General,
  product: Product
}

export default {
  functional: true,
  render: (h, { props, data, children }) => {
    return h(templates[props.template], data, children)
  },
  props: {
    template: {
      type: String,
      required: true
    }
  }
}
