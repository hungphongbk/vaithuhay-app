<style lang="scss" scoped>
  @import "./header.scss";

  .btn {
    cursor: pointer;
  }
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Danh sách bài viết
    hr
    .card-columns
      .card.mb-3(v-for="article in articles")
        .card-body
          h5.card-title {{article.title}}
          p.text-primary(v-for="item in article.relatedProduct")
            i.fa.fa-paperclip.mr-2
            | {{item?item.title:'undefined'}}
        .card-footer
          .btn.btn-secondary(@click="selected=article") Chỉnh sửa
    modal(v-if="selected")
      .modal-header
        h5.modal-title Gắn bài viết với sản phẩm
        button.close(type="button", aria-label="Close", @click="selected=null")
          span(aria-hidden="true") ×
      .modal-body
        product-selector(v-model="selected.meta.relatedProduct.item")
      .modal-footer
        save-button.btn.btn-success(:fn="saveSelected")
</template>
<script>
  import ProductSelector from '../components/product-selector.vue'
  import {findProduct} from "../plugins"

  export default {
    components: {ProductSelector},
    data() {
      return {
        selected: null
      }
    },
    computed: {
      articles() {
        const self = this;
        return self.$store.state.articles.articles.map(a => ({
          ...a,
          get relatedProduct() {
            const {meta} = a;
            if (!meta.relatedProduct || !meta.relatedProduct.item || meta.relatedProduct.item.length === 0) return [];
            const products = meta.relatedProduct.item.map(findProduct)
            for (let i = 0; i < products.length; i++) {
              if (typeof products[i] === 'undefined' || products[i] === null) {
                self.$delete(products, i);
                self.$delete(meta.relatedProduct.item, i);
              }
            }
            return products;
          }
        }));
      }
    },
    watch: {
      selected(value) {
        if (value === null) return;
        if (typeof value.meta.relatedProduct === 'undefined') {
          this.$set(value.meta, 'relatedProduct', {
            item: []
          })
        }
      }
    },
    methods: {
      async saveSelected() {
        await this.$store.dispatch('articles/update', {
          id: this.selected.id,
          key: 'relatedProduct',
          value: this.selected.meta.relatedProduct
        })
        this.selected = null;
      }
    }
  }
</script>
