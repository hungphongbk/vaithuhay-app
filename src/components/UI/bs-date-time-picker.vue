<style lang="scss" scoped>
.date /deep/ .bootstrap-datetimepicker-widget.dropdown-menu {
  box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.61);
  border: none;
  padding: 0.5rem;
}
</style>
<template lang="pug">
  .input-group.date(:id="id", data-target-input="nearest")
    input.form-control.datetimepicker-input(:data-target="`#${id}`")
    .input-group-append(:data-target="`#${id}`", data-toggle="datetimepicker")
      .input-group-text
        i.fa.fa-calendar
</template>
<script>
import uuid from 'uuid/v4'

export default {
  props: {
    value: String
  },
  data() {
    return {
      id: 'dtpicker-' + uuid()
    }
  },
  computed: {
    defaultDate() {
      if (!this.value || this.value.length === 0) return false
      return this.value
    }
  },
  mounted() {
    $(this.$el).datetimepicker({
      locale: 'vi',
      debug: true,
      defaultDate: this.defaultDate
    })
    $(this.$el).on('change.datetimepicker', ({ date }) =>
      this.$emit('input', date.toString())
    )
  }
}
</script>
