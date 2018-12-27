export default {
  state: () => ({
    list: [],
    loaded: false
  }),
  mutations: {
    SOCKET_getMetafieldsCompleted(state, metafields) {
      state.list = Object.entries(metafields).map(([key, obj]) => {
        return {
          key,
          ...obj
        }
      })
      state.loaded = true
    }
  }
}
