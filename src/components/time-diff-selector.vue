<style lang="scss" module>
@import '../scss/inc';

.number {
  border-radius: 0;
  border-top-left-radius: $border-radius !important;
  border-bottom-left-radius: $border-radius !important;
  width: 5rem;
}
</style>
<template lang="pug">
  div
    .input-group
      .input-group-prepend
        input.form-control(:class="$style.number" type="text" v-model="number")
      select.custom-select(v-model="t")
        option(v-for="tm in timestamps" :value="tm[0]") {{tm[1]}}
</template>
<script>
export default {
  props: {
    value: {
      type: Number | String,
      default: 0
    }
  },
  data() {
    return {
      number: 0,
      t: 1,
      timestamps: [[1, 'Giây'], [60, 'Phút'], [3600, 'Giờ'], [86400, 'Ngày']]
    }
  },
  computed: {
    valueToNumber() {
      return this.value * 1
    }
  },
  watch: {
    valueToNumber: {
      handler(value) {
        for (let i = this.timestamps.length - 1; i >= 0; i--) {
          if (value % this.timestamps[i][0] === 0) {
            Object.assign(this, {
              number: Math.round(value / this.timestamps[i][0]),
              t: this.timestamps[i][0]
            })
            return
          }
        }
        this.number = 0
        this.t = 1
      },
      immediate: true
    },
    number(value) {
      this.$emit('input', value * this.t)
    },
    t(value) {
      this.$emit('input', this.number * value)
    }
  }
}
</script>
