<style lang="scss" scoped>
  @import "./header.scss";
  @import "../scss/inc/mixins";

  .message-list {
    .fa-stack {
      margin-right: .3rem;
    }
    td {
      padding: .5rem;
      h6 {
        margin-bottom: .4rem;
        &, > * {
          display: inline-block;
        }
      }
      p {
        margin-bottom: 0;
      }
    }
  }

  .message-icon {
    @include aspect-ratio(1, 1);
    overflow: hidden;
    width: 50px;
    float: left;
    & + .message-body {
      margin-left: 58px;
    }
    img {
      height: 100%;
      width: auto;
    }
  }

  .message-actions {
    a {
      padding: {
        top: .2rem;
        bottom: .2rem;
        right: .7rem;
      }
      margin-right: .7rem;
      &:not(:last-child) {
        border-right: 1px solid #ccc;
      }
    }
  }

  a{
    cursor: pointer;
  }
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title
        fa-round.mr-4(icon="commenting-o")
        | Thông báo đẩy
    page-tabs
      page-tab#list(title="Quản lý")
        .dropdown
          button.btn.btn-secondary.dropdown-toggle(type="button", data-toggle="dropdown" aria-haspopup="true" aria-expanded="false") <i class='fa fa-plus' /> TIN NHẮN MỚI
          .dropdown-menu(aria-labelledby="dropdownMenuButton")
            a.dropdown-item(href="#", @click="newPushNotiStatus='general'") Tin nhắn chung
            a.dropdown-item(href="#") Sản phẩm mới
            a.dropdown-item(href="#") Bài viết mới
        br
        table.table.table-hover.message-list
          tbody(v-if="list.length===0")
            tr
              td Chưa có tin nhắn nào
          template(v-else)
            thead
              tr
                th #
                th.w-60 Tin nhắn
                th Loại tin nhắn
                th Gửi đi lúc
                th Thống kê
            tbody
              tr(v-for="(item,index) in list")
                th(scope="row") {{index+1}}
                td
                  .message-icon(v-if="item.hasIcon")
                    .content
                      img(:src="item.message.icon")
                  .message-body
                    h6 {{item.message.title}}
                    p.small.text-primary.mb-1(v-if="item.hasLink")
                      i.fa.fa-link.mr-1
                      | {{item.link}}
                    p.small.muted
                      i {{item.message.body}}
                  .message-actions.mt-2
                    .small
                      a.text-primary(v-if="!item.isDelivered", @click="resend(item._id)") Gửi ngay
                      save-button.text-warning.dev-label.no-icon(v-if="$appDevMode", type="label", :fn="[resend,item._id]", title="Gửi lại")
                      save-button.text-danger.dev-label.no-icon(v-if="$appDevMode", :fn="[del,item._id]", title="Xóa", type="label")
                td
                  p {{item.messageType}}
                td
                  p.text-success.small(v-if="item.isDelivered")
                    i {{item.createdAt | moment('from')}}
                  p.small(v-else)
                    i.text-muted Chưa gửi đi
                td
      page-tab#setting(title="Cài đặt")
        save-button.mb-4.mr-2(:fn="saveSettings", title="Lưu lại")
        save-button.mb-4(:disabled="!$appDevMode", :fn="test", title="[Test only]")
        .row
          .col-sm-6
            .card
              h5.card-header Tin nhắn chào mừng
              .card-body
                .form-group
                  label Tiêu đề
                  input.form-control(v-model="settings.welcome.title")
                .form-group
                  label Nội dung
                  textarea.form-control(v-model="settings.welcome.body")
                .form-group
                  label URL <i>Có thể bỏ trống</i>
                  input.form-control(v-model="settings.welcome.click_action")
    modal(v-if="newPushNotiStatus", title="Thông báo đẩy mới", @dismiss="newPushNotiStatus=null")
      message-composer(:template="newPushNotiStatus", @created="message=>createPushNoti(message)")
</template>
<script>
  import PushNotification from '@client/store/push-noti'
  import {Settings} from "@client/plugins";
  import MessageComposer from './push-noti/message-composer.vue'
  import {Pagination} from "@client/components";

  const settings = new Settings.DB('push-noti');

  export default {
    components: {
      MessageComposer,
      Pagination
    },
    data() {
      return {
        settings: {
          welcome: {
            title: '',
            body: '',
            click_action: ''
          }
        },
        newPushNotiStatus: null
      }
    },
    computed: {
      list() {
        return this.$store.getters['noti/list']
      }
    },
    methods: {
      async fetchSettings() {
        const json = await settings.get('welcome');
        Object.assign(this.settings.welcome, {title: '', body: ''}, json)
      },
      async saveSettings() {
        await settings.set('welcome', this.settings.welcome)
      },
      async test() {
        await this.$store.dispatch('noti/send', {
          message: this.settings.welcome,
          test: true
        })
      },
      async createPushNoti(payload) {
        this.newPushNotiStatus = null;
        await this.$store.dispatch('noti/send', payload)
      },
      async resend(_id) {
        await this.$store.dispatch('noti/resend', _id)
      },
      async del(_id) {
        await this.$store.dispatch('noti/delete', _id);
      }
    },
    async created() {
      const store = this.$store;
      if (!(store && store.state && store.state['noti']))
        store.registerModule('noti', PushNotification);
      await Promise.all([
        this.fetchSettings(),
        this.$store.dispatch('noti/fetch')
      ])
    }
  }
</script>
