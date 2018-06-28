import "roboto-fontface/css/roboto/sass/roboto-fontface.scss"
import 'jquery'
import 'bootstrap'
import 'tempusdominus-bootstrap-4'
import 'tempusdominus-bootstrap-4/build/css/tempusdominus-bootstrap-4.css'
import 'regenerator-runtime/runtime'

import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import {sync} from 'vuex-router-sync'
import './plugins'
import auth from './plugins/auth'
import './scss/styles.scss'

sync(store, router);
auth(store, router);

if (process.env.NODE_ENV !== 'production')
  Vue.prototype.$devMode = true;
new Vue({
  router,
  store,
  el: '#app',
  render: h => h(App),
});
