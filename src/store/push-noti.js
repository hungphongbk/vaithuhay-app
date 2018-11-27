import { get, post, patch, del } from '@client/plugins/jquery-ajax'
import clone from 'lodash/clone'

function normalizeMessage(message) {
  const optionals = ['click_action', 'icon']
  optionals.forEach(field => {
    if (process.env.NODE_ENV === 'development') console.log(field)
    if (typeof message[field] === 'string')
      if (message[field] === null || message[field].length === 0)
        delete message[field]
      else if (!/^https:\/\//.test(message[field]))
        message[field] = 'https://' + message[field]
  })
  return message
}

class PushNotiMessage {
  _id
  status
  message
  createdAt
  options

  static create(payload) {
    return new PushNotiMessage(payload)
  }

  constructor(payload) {
    Object.assign(
      this,
      {
        status: null,
        options: {
          messageType: 'general'
        }
      },
      payload
    )
  }

  get hasLink() {
    const { message } = this
    return (
      typeof message.click_action === 'string' &&
      message.click_action.length > 0
    )
  }

  // "click-action" without UTM parameters
  get link() {
    if (this.hasLink) return this.message.click_action.split('?')[0]
    return ''
  }

  get hasIcon() {
    const { message } = this
    return typeof message.icon === 'string' && message.icon.length > 0
  }

  get isDelivered() {
    if (this.status === null) return true
    return this.status === 'delivered'
  }

  get messageType() {
    const types = {
      general: 'Tin nhắn chung',
      product: 'Sản phẩm',
      news: 'Bài viết'
    }
    return types[this.options.messageType]
  }
}

export default {
  namespaced: true,
  state() {
    return {
      list: []
    }
  },
  getters: {
    list: ({ list }) => list.map(PushNotiMessage.create)
  },
  mutations: {
    fetch(state, { list }) {
      state.list = list
    },
    send({ list }, message) {
      list.unshift(message)
    },
    store({ list }, message) {
      list.unshift(message)
    },
    resend({ list }, id) {
      const f = list.find(item => item._id === id)
      f.status = 'delivered'
    },
    delete({ list }, id) {
      const i = list.findIndex(item => item._id === id)
      list.splice(i, 1)
    }
  },
  actions: {
    async fetch({ commit, dispatch }) {
      const { status, messages, message: errorMsg } = await get('/noti/list')
      if (status === 'ok') {
        commit('fetch', { list: messages })
      } else
        dispatch(
          'notifications/pushDanger',
          {
            title: 'Lỗi khi nhận danh sách tin nhắn',
            message: errorMsg
          },
          { root: true }
        )
    },
    async send(
      { commit, dispatch, rootGetters },
      { message, test = false, options = {}, stored = false }
    ) {
      const modifiedMessage = normalizeMessage(clone(message, true))
      //add options to message body
      Object.assign(modifiedMessage, { options })
      if (test)
        modifiedMessage.body =
          `(Sent by ${rootGetters['auth/currentUser'].name}) ` +
          modifiedMessage.body

      const willSend = !stored,
        URL = willSend ? '/noti/broadcast/' : '/noti/store/'

      //enter DEBUG MODE if DEVMODE=true or explicitly set `test` param
      const { status, message: msg } = await post(
        URL + (test || rootGetters['app/devMode'] ? '?debug=true' : ''),
        modifiedMessage
      )
      if (status === 'ok') {
        if (typeof msg !== 'undefined' && msg !== null)
          commit(willSend ? 'send' : 'store', msg)
        dispatch(
          'notifications/pushSuccess',
          {
            title: (stored ? 'Lưu trữ' : 'Gửi') + ' thông báo đẩy thành công'
          },
          { root: true }
        )
      } else
        dispatch(
          'notifications/pushDanger',
          {
            title: 'Lỗi khi gửi thông báo đẩy',
            message: msg
          },
          { root: true }
        )
    },
    async resend({ commit, dispatch, rootGetters }, _id) {
      try {
        await patch(
          '/noti/resend/?_id=' +
            _id +
            (rootGetters['app/devMode'] ? '&debug=true' : '')
        )
        commit('resend', _id)
        dispatch(
          'notifications/pushSuccess',
          {
            title: 'Gửi lại thông báo đẩy thành công'
          },
          { root: true }
        )
      } catch (e) {
        console.error(e.message)
      }
    },
    async delete({ commit }, _id) {
      await del('/noti/?_id=' + _id)
      commit('delete', _id)
    }
  }
}
