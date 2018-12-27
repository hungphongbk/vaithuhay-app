export default {
  state: () => ({
    list: [],
    loaded: false
  }),
  mutations: {
    SOCKET_getMetafieldsCompleted(state, metafields) {
      console.log(metafields)
      state.loaded = true
    }
  }
}
