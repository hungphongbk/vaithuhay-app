<style lang="scss">
.fade- {
  &enter-active,
  &leave-active {
    transition: all 0.25s ease;
  }
  &enter,
  &leave-to {
    opacity: 0;
  }
}
</style>
<template lang="pug">
  transition(name="fade")
    div
      .modal-backdrop.show
      .modal(style="display:block", role="dialog")
        .modal-dialog(role="document", :class="classes")
          .modal-content
            template(v-if="title")
              .modal-header(:class="{'border-bottom-0 pb-0': !borderBottom}")
                h5.modal-title {{title}}
                button.close(v-if="dismissable" type="button", aria-label="Close", @click="$emit('dismiss')")
                  span(aria-hidden="true") ×
            slot
</template>
<script>
export default {
  props: {
    title: String,
    size: {
      type: String,
      default: ''
    },
    dismissable: {
      type: Boolean,
      default: true
    },
    borderBottom: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    classes() {
      const cls = []
      if (this.size.length > 0) cls.push(`modal-${this.size}`)

      return cls
    }
  }
}
</script>
