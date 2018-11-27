import Vue from 'vue'
import SaveButton from '../components/save-button.vue'
import ProgressButton from '../components/progress-button.vue'
import VueAsyncComputed from 'vue-async-computed'
import Draggable from 'vuedraggable'
import PageTabs from '../components/page-tabs.vue'
import PageTab from '../components/page-tab.vue'
import ListManagement from '../components/list-management'
import Modal from '../components/modal.vue'
import patch from './patch'
import store from '../store'
import moment from 'moment'
import 'moment/locale/vi'
import VueMoment from 'vue-moment'
import FontAwesomeIcon from '@fortawesome/vue-fontawesome'
import './socket'

Vue.use(VueAsyncComputed)
Vue.use(VueMoment, { moment })
// Vue.use(VueWebSocket, process.env.NODE_ENV==='production'?'':'ws://localhost:8089', {
//   format: 'json'
// });
Vue.directive('ml', (el, { value }) => {
  if (!$(el).hasClass('input-multi-lang')) {
    $(el).addClass('input-multi-lang')
  }
  $(el).attr('data-lang', value.toUpperCase())
})
Vue.component('save-button', SaveButton)
Vue.component('progress-button', ProgressButton)
Vue.component('draggable', Draggable)
Vue.component('page-tabs', PageTabs)
Vue.component('page-tab', PageTab)
Vue.component('list-management', ListManagement)
Vue.component('modal', Modal)

Vue.mixin(patch)

export function findProduct(id) {
  return store.state.products.products.find(p => p.id * 1 === id * 1)
}

Vue.filter('product', id =>
  store.state.products.products.find(product => product.id * 1 === id * 1)
)

Vue.component('fa-round', {
  functional: true,
  render: (h, { props }) => {
    return (
      <span class="fa-stack">
        <i class={`fa fa-${props.type} fa-stack-2x`} />
        <i class={`fa fa-${props.icon} fa-stack-1x fa-inverse`} />
      </span>
    )
  },
  props: {
    type: {
      type: String,
      default: 'circle'
    },
    icon: {
      type: String,
      required: true
    }
  }
})

export { default as Settings } from './settings'

Vue.component('fa-icon', FontAwesomeIcon)
