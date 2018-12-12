import CollectionSlider from './PageSectionItemCollectionSlider.vue'
import should from 'should'

const Types = {
  CollectionSlider
}

export default {
  name: 'PageSectionItem',
  functional: true,
  render: (h, { props, data, children }) => {
    return h(Types[props.item.type], data, children)
  },
  props: {
    item: {
      type: Object,
      validator(value) {
        return should(value).have.properties(['type', 'data'])
      }
    }
  }
}
