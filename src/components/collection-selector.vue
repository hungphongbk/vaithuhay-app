<template lang="pug">
  div
</template>
<script>
import { mapState } from 'vuex'
export default {
  computed: {
    ...mapState({
      collections: state => state.categories.categories
    })
  }
}
</script>
