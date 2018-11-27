<style lang="scss" scoped>
@import './header.scss';
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Danh mục sản phẩm
      save-button(:fn="save")
    hr
    .card-columns
      .card(v-for="c in collections")
        .card-body
          h5.card-title {{c.title}}
          form
            .form-group
              label.control-label Dịch sang tiếng Anh
              input.form-control(type="text", v-model="c.meta.trans.translated")
          p
            i.fa.fa-picture-o.mr-2
            | {{c.meta.slides.list?c.meta.slides.list.length:0}} ảnh trong slide
        .card-footer
          router-link.btn.btn-secondary.mr-2(:to="{name: 'cat.detail', params: {id: c.id}}") Chỉnh sửa khác
          button.btn.mr-2(:class="c.meta.settings.enable?'btn-success':'btn-secondary'", @click="c.meta.settings.enable = !c.meta.settings.enable") {{c.meta.settings.enable?'Hiện':'Ẩn'}}
          save-button(v-if="c.handle==='onsale'", :fn="updateOnSale", title="Cập nhật", :lg="false")
</template>
<script>
import { get, post } from '../plugins/jquery-ajax'
import { mapState } from 'vuex'

export default {
  page: 'categories',
  computed: {
    collections() {
      return this.$store.state.categories.categories
    }
  },
  methods: {
    async save() {
      await this.$store.dispatch('categories/saveAll')
    },
    async updateCollection(collection) {
      const btn = this.$refs[collection][0]
      btn.inProgress = true
      await post(`/collections/${collection}`)
      btn.inProgress = false
    },
    async updateOnSale() {
      await post('/collections/promo')
      await this.$store.dispatch('notifications/pushSuccess', {
        message: 'Cập nhật danh sách SP khuyến mãi thành công'
      })
    }
  }
}
</script>
