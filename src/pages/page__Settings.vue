<style lang="scss" scoped>
@import './header.scss';

.nav.nav-tabs {
  margin-top: 20px;
}
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Cài đặt
      .btn.btn-default.btn-lg.btn-lang.bold(@click="switchLang") {{lang}}
      save-button(:fn="save")
    page-tabs
      page-tab#general(title="cài đặt chung")
        h5.mb-3 Cập nhật tự động
        table
          tr
            td(width="200px") <p>Sản phẩm mới</p>
            td
              p
                time-diff-selector.d-inline-block.mr-2(v-model="generalSettings.autoUpdateNewProducts")
                | mỗi lần
      page-tab#footer-panel(title="footer")
        .alert.alert-light(role="alert")
          h5.alert-heading Quy ước
          hr
          p Mỗi đường link xuất hiện trong Footer viết trên một dòng
          p Đường link có dạng&nbsp;
            span.font-italic (tiêu đề)[link]
        .row
          .col-sm-6
            .card
              h5.card-header Về chúng tôi
              .card-body
                .form-group
                  textarea.form-control(rows="6", v-model="about$raw[lang]")
          .col-sm-6
            .card
              h5.card-header Các chính sách
              .card-body
                .form-group
                  textarea.form-control(rows="6", v-model="policy$raw[lang]")
      page-tab#socials-panel(title="mạng xã hội")
        .row
          .col-sm-6
            .form-group
              .input-group
                span.input-group-addon
                  i.fa.fa-facebook
                input.form-control(v-model="socials.fb")
            .form-group
              .input-group
                span.input-group-addon
                  i.fa.fa-google
                input.form-control(v-model="socials.google")
            .form-group
              .input-group
                span.input-group-addon
                  i.fa.fa-instagram
                input.form-control(v-model="socials.insta")
            .form-group
              .input-group
                span.input-group-addon
                  i.fa.fa-twitter
                input.form-control(v-model="socials.twitter")
</template>
<script>
import { multiLang, d } from '../helpers/mixins'
import debounce from 'lodash/debounce'
import { get, post } from '../plugins/jquery-ajax'
import { TimeDiffSelector } from '@client/components'

const mdToList = text =>
    text.split(/\r?\n/).map(line => {
      const [, title, url] = /^\((.*)\)\[(.*)]$/.exec(line.trim())
      return { title, url }
    }),
  listToMd = list =>
    list.map(({ title, url }) => `(${title})[${url}]`).join('\n')

export default {
  mixins: [multiLang],
  components: { TimeDiffSelector },
  data() {
    return {
      about$raw: d(() => ''),
      policy$raw: d(() => ''),
      socials: {
        fb: '',
        google: '',
        insta: '',
        twitter: ''
      },
      generalSettings: {
        autoUpdateNewProducts: 300
      }
    }
  },
  methods: {
    async save() {
      const about = {
          en: mdToList(this.about$raw.en),
          vi: mdToList(this.about$raw.vi)
        },
        policy = {
          en: mdToList(this.policy$raw.en),
          vi: mdToList(this.policy$raw.vi)
        }
      await post('/meta?key=footer', { about, policy, socials: this.socials })
      await post('/meta?key=generalSettings', this.generalSettings)
    },
    async fetch() {
      const { about, policy, socials } = await get('/meta?key=footer')
      this.about$raw.en = listToMd(about.en || [])
      this.about$raw.vi = listToMd(about.vi || [])
      this.policy$raw.en = listToMd(policy.en || [])
      this.policy$raw.vi = listToMd(policy.vi || [])
      if (socials) this.socials = socials

      Object.assign(
        this.generalSettings,
        (await get('/meta?key=generalSettings')) || {}
      )
    }
  },
  async mounted() {
    await this.fetch()
  }
}
</script>
