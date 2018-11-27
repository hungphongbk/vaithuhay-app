<style lang="scss" scoped>
.nav.nav-tabs {
  margin-top: 20px;
}

.nav-item a {
  text-transform: uppercase;
  cursor: pointer;
  &.active {
    font-weight: 700;
  }
}
</style>
<template lang="pug">
  div
    ul.nav.nav-tabs
      li.nav-item(v-for="tab in tabs")
        a.nav-link(role="tab", :class="{'active': tab===active}", @click="switchTab({id: tab.$attrs.id, $router})") {{tab.title}}
    .tab-content
      slot
</template>
<script>
import { mapActions } from 'vuex'

export default {
  props: {
    hash: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      tabs: [],
      local: ''
    }
  },
  computed: {
    activeStorage() {
      if (this.hash) {
        const hash = this.$store.getters.hash
        return hash.tab || (this.tabs[0] ? this.tabs[0].$attrs.id : '')
      } else {
        return this.local
      }
    },
    active() {
      const active = this.activeStorage
      return this.tabs.find(tab => tab.$attrs.id === active)
    }
  },
  provide() {
    const self = this
    const tabs = {
      get active() {
        return self.active
      }
    }
    return { tabs }
  },
  methods: {
    ...mapActions({
      switchTab_: 'switchTab'
    }),
    switchTab(arg) {
      this.local = arg.id
      if (this.hash) this.switchTab_(arg)
    },
    add(tab) {
      this.tabs.push(tab)
    }
  }
}
</script>
