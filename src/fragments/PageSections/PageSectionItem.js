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
  render: (h, { props, listeners }) => {
    const Type = Types[props.item.type]
    return (
      <div class="card">
        <div class="card-body p-3">
          <button class="close">
            <span aria-hidden={'true'}>&times;</span>
          </button>
          <Type data={props.item.data} {...listeners} />
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
