<style lang="scss">
</style>
<template lang="pug">
  .tab-pane.fade(:class="{'show active': active}")
    slot
</template>
<script>
  export default {
    props: {
      title: String
    },
    inject: ['tabs'],
    computed: {
      active() {
        return this.tabs.active === this;
      }
    },
    created() {
      this.$parent.add(this);
    }
  }
</script>
