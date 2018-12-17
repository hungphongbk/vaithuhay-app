export default {
  state: () => ({
    stat: {
      size: '-'
    },
    images: [],
    loaded: false
  }),
  mutations: {
    SOCKET_storageStatusCompleted(state, stat) {
      Object.assign(state, { stat })
    },
    SOCKET_fetchImagesCompleted(state, { images }) {
      state.images = images
      state.loaded = true
    },
    SOCKET_uploadImageDone(state, image) {
      state.images.push(image)
    },
    SOCKET_deleteImageSucceeded(state, { _id }) {
      const index = state.images.findIndex(img => img._id === _id)
      state.images.splice(index, 1)
    }
  },
  actions: {}
}
