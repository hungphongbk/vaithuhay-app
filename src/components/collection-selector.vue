<template lang="pug">
  div
</template>
<script>
import { mapState } from 'vuex'
export default {
  props: {
    value: {
      type: Array,
      required: true
    }
  },
  computed: {
    ...mapState({
      collections: state => state.categories.categories
    })
  }
}
</script>
