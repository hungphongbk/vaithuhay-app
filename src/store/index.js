import Vue from 'vue'
import Vuex from 'vuex'
import products from './products'
import categories from './categories'
import articles from './articles'
import notifications from './notifications'
import auth from './auth'
import images from './images'
import metafields from './metafields'
import qs from 'query-string'
import { getXhr } from '../plugins/jquery-ajax'
import VuexPersistence from 'vuex-persist'
import * as types from './types'

Vue.use(Vuex)
const { plugin: vuexLocal } = new VuexPersistence({
  storage: window.localStorage,
  reducer: state => ({
    dev: state.dev
  })
})
// {plugin: vuexSession} = new VuexPersistence({
//   storage: window.sessionStorage,
//   reducer: state => ({
//     products: state.products,
//     articles: state.articles
//   })
// });

const store = new Vuex.Store({
  state() {
    return {
      appConfig: {},
      isConnected: false,
      dev: false
    }
  },
  getters: {
    hash({}, {}, { route }) {
      return qs.parse(route.hash)
    },
    [types.G_APP_DEV_MODE](state) {
      return state.dev
    }
  },
  mutations: {
    SOCKET_CONNECT(state) {
      state.isConnected = true
    },
    SOCKET_DISCONNECT(state) {
      state.isConnected = false
    },
    ['app/configLoaded'](state, config) {
      state.appConfig = config
    },
    [types.M_APP_TOGGLE_DEV_MODE](state, value) {
      state.dev = value
    }
  },
  actions: {
    switchTab({}, { id, $router }) {
      $router.push({ hash: '#tab=' + id })
    },
    async loadConfig({ commit }) {
      commit('app/configLoaded', await getXhr('/dist/config.json'))
    }
  },
  modules: {
    products,
    categories,
    articles,
    auth,
    notifications,
    images,
    metafields
  },
  plugins: [vuexLocal]
})

Object.defineProperty(Vue.prototype, '$appDevMode', {
  get() {
    return store.state.dev
  }
})

export default store
