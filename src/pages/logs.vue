<style lang="scss" scoped>
  @import "./header.scss";

  .btn {
    cursor: pointer;
  }

  .json-data {
    height: 600px;
    max-height: 600px;
    overflow: scroll;
  }
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Nhật kí hoạt động
    page-tabs
      page-tab#order-data(title="Order data")
        p
          span 50 sự kiện đặt hàng mới nhất
          span
            .btn.btn-secondary.ml-4 Cập nhật đơn hàng
        table.table
          thead
            tr
              th(scope="col") Tên sự kiện
          tbody
            tr(v-for="event in paginatedOrders")
              td(@click="selected=event") {{event.key}}
        nav
          ul.pagination
            li.page-item(v-for="i in pageRange", :class="{'active':i===pageCurrent}")
              a.page-link(@click="pageCurrent=i") {{i}}
        modal(v-if="selected", :title="`Xem nhật kí ${selected.key}`", @dismiss="selected=null", size="lg")
          .modal-body
            textarea.form-control.json-data {{beautify(selected.value)}}
</template>
<script>
  import {get} from '../plugins/jquery-ajax'
  import beautify from 'json-beautify'
  import range from 'lodash/range'

  export default {
    data() {
      return {
        logs: [],
        pages: 0,
        pageList: [true],
        pageCurrent: 1,
        selected: null
      }
    },
    computed: {
      orders() {
        return this.logs.filter(log => log.category === 'haravan_order_data');
      },
      firstPage() {
        return 1;
      },
      lastPage() {
        return this.pages < 10 ? this.pages : 10;
      },
      pageRange() {
        return range(this.firstPage, this.lastPage + 1)
      },
      paginatedOrders() {
        const {pageCurrent: p, orders} = this,
          [first, last] = [(p - 1) * 20, p * 20 - 1];
        return orders.slice(first, last)
      }
    },
    methods: {
      beautify(json) {
        console.log(beautify(JSON.parse(json), null, 2, 1000));
        return beautify(JSON.parse(json), null, 2, 1000);
      }
    },
    watch: {
      pageCurrent(page) {
        if (!this.pageList[page]) {
          get('/logs?page=' + page, true)
            .then(({logs}) => {
              for (let i = 0; i < 20; i++)
                this.$set(this.logs, (page - 1) * 20 + i, logs[i]);
              this.pageList[page] = true;
            })
        }
      }
    },
    async mounted() {
      if (this.logs.length === 0) {
        const {logs, pages} = await get('/logs', true);
        this.logs.push(...logs);
        this.pages = pages;
      }
    }
  }
</script>
