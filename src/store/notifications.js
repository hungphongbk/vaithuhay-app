import uuid from 'uuid/v4'
import Vue from 'vue'

class NotificationItem {
  label
  title
  message
  callback
  metadata
  autoRemove
  timeout
  fade

  constructor(context, obj) {
    this.context = context
    this.id = uuid()
    Object.assign(
      this,
      {
        autoRemove: true,
        timeout: 3000,
        fade: false
      },
      obj
    )

    if (!this.callback) {
      if (this.autoRemove) this.remove()
    } else {
      Vue.nextTick(() => {
        this.callback(this).then(() => {
          if (this.autoRemove) this.remove()
        })
      })
    }
  }

  remove() {
    const fn = () => {
      this.context.commit('fade', this.id)
      setTimeout(() => {
        this.context.commit('removeNoti', this.id)
      }, this.timeout)
    }
    if (this.autoRemove) setTimeout(() => fn(), this.timeout)
    else fn()
  }

  updateMessage(message) {
    const obj = {
      id: this.id,
      message
    }
    this.context.commit('update', obj)
  }

  updateMeta(metadata) {
    const obj = {
      id: this.id,
      metadata
    }
    this.context.commit('update', obj)
  }

  changeContextual(label) {
    const obj = { id: this.id, label }
    this.context.commit('update', obj)
  }
}

export default {
  namespaced: true,
  state: () => ({
    list: []
  }),
  mutations: {
    pushNoti(state, noti) {
      state.list.unshift(noti)
    },
    removeNoti({ list }, id) {
      const index = list.findIndex(item => item.id === id)
      list.splice(index, 1)
    },
    update({ list }, obj) {
      const index = list.findIndex(item => item.id === obj.id)
      try {
        Object.assign(list[index], obj)
      } catch (e) {
        console.error(obj.id)
        throw e
      }
    },
    fade({ list }, id) {
      const index = list.findIndex(item => item.id === id)
      Object.assign(list[index], { fade: true })
    }
  },
  actions: {
    pushNoti({ commit }, noti) {
      console.log(noti.id)
      commit('pushNoti', noti)
    },
    pushDanger(context, obj) {
      obj.title = obj.title || ''
      context.dispatch(
        'pushNoti',
        new NotificationItem(context, {
          label: 'danger',
          ...obj
        })
      )
    },
    pushSuccess(context, obj) {
      obj.title = obj.title || ''
      context.dispatch(
        'pushNoti',
        new NotificationItem(context, {
          label: 'success',
          ...obj
        })
      )
    },
    pushInfo(context, obj) {
      obj.title = obj.title || ''
      context.dispatch(
        'pushNoti',
        new NotificationItem(context, {
          label: 'info',
          ...obj
        })
      )
    }
  }
}
