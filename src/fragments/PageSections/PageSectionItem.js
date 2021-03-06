import CollectionSlider from './PageSectionItemCollectionSlider.vue'
import Promotions from './PageSectionItemPromotions.vue'
import Banner from './PageSectionItemBanner.vue'
import should from 'should'
import styles from './PageSectionItem.m-scss'

const Types = {
  CollectionSlider,
  Promotions,
  Banner
}

export default {
  name: 'PageSectionItem',
  functional: true,
  render: (h, { props, listeners }) => {
    const Type = Types[props.item.type]
    return (
      <div class={`card mt-2 ${styles.card}`}>
        <div class="card-body p-3">
          <button class={`close ${styles.close}`}>
            <span aria-hidden={'true'} onClick={listeners.remove}>
              &times;
            </span>
          </button>
          <Type data={props.item.data} onUpdate={listeners.update} />
        </div>
      </div>
    )
  },
  props: {
    item: {
      type: Object
      // validator(value) {
      //   return should(value).have.properties(['type', 'data'])
      // }
    }
  }
}
