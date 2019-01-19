<style lang="scss" module>
.wrapper {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  width: 300px;
  height: auto;
}
.alert {
  opacity: 1;
  transition: opacity 3s ease, background-color 0.3ms ease,
    border-color 0.3ms ease;
}
.fade {
  opacity: 0;
}
</style>
<template lang="pug">
  div(:class="$style.wrapper")
    .alert(v-for="alert in list", :key="alert.id", :class="{[`alert-${alert.label}`]: true, [$style.alert]:true, [$style.fade]: alert.fade}", role="alert")
      div
        h6.d-inline-block(v-if="alert.title.length>0") {{alert.title}}
        button.close(v-if="!alert.autoRemove" type="button" aria-label="Close" @click="()=>alert.remove()")
          span(aria-hidden="true") &times;
      component(v-if="alert.message.render" :is="alert.message" :metadata="alert.metadata")
      p(v-else v-html="alert.message")
      progress-bar(v-if="alert.withProgress" :value="alert.metadata.percentage")
</template>
<script>
import ProgressBar from '@client/components/UI/ProgressBar.vue'
export default {
  components: { ProgressBar },
  computed: {
    list() {
      return this.$store.state.notifications.list
    }
  }
}
</script>
