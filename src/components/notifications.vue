<style lang="scss" scoped>
  .wrapper {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 300px;
    height: auto;
  }
</style>
<template lang="pug">
  .wrapper
    .alert(v-for="alert in list", :key="alert.id", :class="[`alert-${alert.label}`]", role="alert")
      h6(v-if="alert.title.length>0") {{alert.title}}
      component(v-if="alert.message.render" :is="alert.message" :metadata="alert.metadata")
      p(v-else v-html="alert.message")
</template>
<script>
  export default {
    computed: {
      list() {
        return this.$store.state.notifications.list;
      }
    }
  }
</script>
