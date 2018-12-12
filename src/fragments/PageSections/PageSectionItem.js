import CollectionSlider from './PageSectionItemCollectionSlider.vue'
import Promotions from './PageSectionItemPromotions.vue'
import should from 'should'

const Types = {
  CollectionSlider,
  Promotions
}

export default {
  name: 'PageSectionItem',
  functional: true,
  render: (h, { props, data, children }) => {
    return (
      <div class="card">
        <div class="card-body p-3">
          <button class="close">
            <span aria-hidden={'true'}>&times;</span>
          </button>
          {h(Types[props.item.type], data, children)}
        </div>
      </div>
    )
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
