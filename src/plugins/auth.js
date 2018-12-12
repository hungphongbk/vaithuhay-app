import Vue from 'vue'

Vue.mixin({
  methods: {
    hasRole(role) {
      const { permissions } = this.$store.getters['auth/currentUser']
      return permissions.findIndex(r => r === role) >= 0
    }
  }
})

export default (store, router) => {
  const auth = store.state.auth
  router.beforeEach((to, from, next) => {
    //continue normally if redirect to login, or already signed in
    //else, redirect to login, attach old router-link to query
    // console.log(from.name + ' --> ' + to.name);
    if (to.name === 'login') {
      // console.log(from.query, to.query)
      next()
      return
    }
    if (!auth.user)
      next({
        name: 'login',
        query: {
          redirect: to.path
        }
      })
    else next()
  })
}
