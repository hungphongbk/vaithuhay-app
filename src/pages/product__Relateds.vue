<style lang="scss" scoped>
  @import "./header.scss";
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Sản phẩm liên quan
</template>
<script>
  import {mapState} from 'vuex'
  import {postText} from '../plugins/jquery-ajax'

  export default {
    computed: {
      ...mapState({
        products: state => state.products.products
      })
    },
    methods: {
    }
  }
</script>
