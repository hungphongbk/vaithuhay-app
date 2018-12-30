import Vue from 'vue'
import socketio from 'socket.io-client'
import VueSocketIO from 'vue-socket.io'
import store from '../store'

const dev = process.env.NODE_ENV !== 'production'

export const SocketInstance = socketio(
  dev ? 'https://localhost:8089' : 'https://server.vaithuhay.com/',
  dev
    ? {}
    : {
        path: '/b/socket.io',
      }
)

Vue.use(
  new VueSocketIO({
    debug: true,
    connection: SocketInstance,
    vuex: {
      store,
      actionPrefix: 'SOCKET_',
      mutationPrefix: 'SOCKET_'
    }
  })
)
