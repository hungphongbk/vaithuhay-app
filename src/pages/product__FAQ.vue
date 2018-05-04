<style lang="scss" scoped>
  @import "./header.scss";

  .card-body {
    p {
      margin-bottom: .3rem;
      .badge {
        margin-left: .3em;
        &:first-child {
          margin-left: 2em;
        }
      }
    }
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    .card-title {
      flex-shrink: 0;
    }
    .product-item-content {
      flex-grow: 1;
    }
  }

  .btn {
    cursor: pointer;
  }
</style>
<style lang="scss" module="">
  .productItemStatus{
    margin-right: .4rem;
    svg{
      margin-right: .3rem;
    }
    &:global(.text-muted svg){
      display: none;
    }
  }
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Danh sách sản phẩm
        span.badge.badge-secondary.ml-2 {{products.length}}
      .btn.btn-success.btn-lg(@click="updateRelateds") Cập nhật sản phẩm liên quan
      save-button(:fn="updateTops", title="Cập nhật sản phẩm top")
    .row
      .col-sm-12
        .form-inline.mb-4.mt-4
          label.sr-only Tìm kiếm
          input.form-control.form-control-lg.w-50(placeholder="Tìm kiếm sản phẩm", v-model="keyword", @keyup.enter="doSearch")
    .row
      .col-sm-4(v-for="product in searchedProducts")
        .card.mb-3
          .card-body
            h5.card-title.w-100 {{product.title}}
            .product-item-content
              p(:class="ctxCls(product.faq)")
                | FAQ
                span.badge.badge-success(v-if="product.faq") {{product.faq.length}}
                span.badge.badge-warning(v-if="product.faq && product.newFaq && product.newFaq.length>0") {{product.newFaq.length}}
                  sup *
              p
                span(:class="[ctxCls(product.meta.title), $style.productItemStatus]")
                  fa-icon(:icon="faCheck")
                  | Title
                span(:class="[ctxCls(product.meta.desc), $style.productItemStatus]")
                  fa-icon(:icon="faCheck")
                  | Description
              p
                span(:class="[$style.productItemStatus]")
                  fa-icon(:icon="faHeart")
                  | {{product.favorites.length}}
            .product-item-actions
              router-link.btn.btn-secondary(:to="{name: 'product.faq.item', params: {id: product.id}}")
                fa-icon(:icon="faEdit")
    .modal.fade(ref="loadingModal", tabindex="-1", role="dialog")
      .modal-dialog(role="document")
        .modal-content
          .modal-header
            h5.modal-title Đang cập nhật
          .modal-body
            p Cập nhật thành công {{relatedsLabel}} sản phẩm
</template>
<script>
  import {mapState} from 'vuex';
  import {getXhr, postXhr} from '../plugins/jquery-ajax';
  import chunk from 'lodash/chunk';
  import {functions} from "@client/helpers";
  import faEdit from '@fortawesome/fontawesome-free-solid/faEdit';
  import faCheck from '@fortawesome/fontawesome-free-solid/faCheck'
  import faHeart from '@fortawesome/fontawesome-free-solid/faHeart'

  const retry = (fn, params, count) => new Promise(async (resolve, reject) => {
      while (--count >= 0) {
        try {
          const rs = await fn(...params);
          resolve(rs);
          break;
        } catch (e) {
        }
      }
      if (count < 0) resolve(null);
    }),
    {normalizeVie} = functions;

  class Product {
    constructor(p) {
      Object.assign(this, p);
    }

    get faq() {
      return this.meta.faq;
    }

    get newFaq() {
      return this.faq.filter(({vi: {answer}}) => !(typeof answer === 'string' && answer.length > 0));
    }
  }

  export default {
    data() {
      return {
        relateds: 0,
        keyword: '',
        kw: '',
        faEdit,
        faCheck,
        faHeart
      };
    },
    computed: {
      ...mapState({
        products: state => state.products.products.map(p => new Product(p))
      }),
      relatedsLabel() {
        return this.relateds + '/' + this.products.length;
      },
      searchedProducts() {
        const {kw, products} = this;
        if (kw.length === 0) return products;

        const keyword = normalizeVie(kw);
        return products.filter(product => {
          if (normalizeVie(product.title).indexOf(keyword) >= 0) return true;
          if (normalizeVie(product.tags).indexOf(keyword) >= 0) return true;
          return false;
        });
      }
    },
    methods: {
      ctxCls(obj) {
        if (typeof obj !== 'undefined' && obj !== null) {
          return 'text-success';
        }
        if (typeof obj === 'number' && obj > 0) {
          return 'text-success';
        }
        return 'text-muted';
      },
      async updateRelateds() {
        const response = await getXhr('/g');
        if (response.status && response.status === 'login') {
          console.log(window.open(response.url, "_blank", "resizable,scrollbars,status"));
        } else if (true) {
          this.relateds = 0;
          $(this.$refs.loadingModal).modal({
            backdrop: 'static',
            keyboard: false
          });
          for (const products of chunk(this.products, 3)) {
            await Promise.all(products.map(p =>
              retry(postXhr, [`/g/relateds?id=${p.id}`], 3)));
            this.relateds += products.length;
          }
          $(this.$refs.loadingModal).modal('hide');
          $(document.body).removeClass("modal-open");
          $(".modal-backdrop").remove();
        }
      },
      async updateTops() {
        // throw 'ahihi'
        const rs = await postXhr('/g/top');
        const change = {remove: 0, add: 0};
        if (rs.length > 0) {
          change.remove = rs.filter(({type}) => type === '-');
          change.add = rs.filter(({type}) => type === '+');
        }
        const message = rs.length === 0 ? '<i>Không có sự thay đổi nào</i>' : `Loại bỏ <strong>${change.remove.length}</strong> sản phẩm, thêm <strong>${change.add.length}</strong> sản phẩm`;
        await this.$store.dispatch('notifications/pushSuccess', {
          message: 'Cập nhật danh sách sản phẩm hàng đầu thành công :)<br/>' + message
        });
      },
      doSearch() {
        this.kw = this.keyword;
      }
    }
  };
</script>
