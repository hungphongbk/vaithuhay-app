import uuid from 'uuid/v4'

export default {
  namespaced: true,
  state: () => ({
    list: []
  }),
  mutations: {
    pushNoti(state, noti) {
      state.list.unshift(noti);
    },
    removeNoti({list}, id) {
      const index = list.findIndex(item => item.id === id)
      list.splice(index, 1);
    }
  },
  actions: {
    pushNoti({commit}, noti) {
      noti.id = uuid();
      commit('pushNoti', noti);
      setTimeout(() => {
        commit('removeNoti', noti.id)
      }, 3000)
    },
    pushDanger({dispatch}, {title = '', message}) {
      dispatch('pushNoti', {
        label: 'danger',
        title,
        message
      })
    },
    pushSuccess({dispatch}, {title = '', message}) {
      dispatch('pushNoti', {
        label: 'success',
        title,
        message
      })
    }
  }
}