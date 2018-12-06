<style lang="scss" scoped>
@import './header.scss';

.card-columns {
  column-count: 4;
}

.card-img-left {
  border-bottom-left-radius: calc(0.25rem - 1px);
  border-top-left-radius: calc(0.25rem - 1px);
  float: left;
  padding-right: 1em;
  margin-bottom: -1.25em;
}
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Các chương trình khuyến mãi
      .btn.btn-default.btn-lg.btn-lang.bold(@click="switchLang") {{lang}}
      save-button(:fn="save")
      help.float-right(:docs="$docs")
    page-tabs
      page-tab#index(title="Hiển thị trang chủ")
        .row
          .col-sm-6
            .form-group
              label Tên chương trình khuyến mãi
              input.form-control(v-model="newPromo.title")
            .form-group
              label Khi click vào ô khuyến mãi
              .form-check.form-check-inline
                label.form-check-label.mr-2
                  input.form-check-input(type="radio", value="none", v-model="newPromo.behavior")
                  | Không làm gì cả
                label.form-check-label.mr-2
                  input.form-check-input(type="radio", value="copy", v-model="newPromo.behavior")
                  | Copy mã khuyến mãi
                label.form-check-label
                  input.form-check-input(type="radio", value="redirect", v-model="newPromo.behavior")
                  | Chuyển đến URL...
            .form-group(v-if="newPromo.behavior==='copy'")
              label Mã khuyến mãi
              input.form-control(v-model="newPromo.code")
            .form-group(v-if="newPromo.behavior==='redirect'")
              label Đường dẫn khi click vào ô khuyến mãi
              input.form-control(v-model="newPromo.url")
          .col-sm-6
            upload(v-model="newPromo.img[lang]", v-ml="lang")
          .col-sm-12
            .btn.btn-success(@click="add") {{mode==='new'?'Thêm CT khuyến mãi':'Cập nhật'}}
        hr
        draggable(v-model="list")
          transition-group.card-columns(tag="div")
            .card(v-for="(item,index) in list", :key="index")
              img.card-img-top(:src="item.img[lang].thumbnails['300w']")
              .card-body
                h4.card-title(v-if="item.code.length>0") {{item.code}}
                p
                  strong {{index+1}}. {{item.title}}
                button.btn.btn-secondary.mr-1(@click="mode='update';newPromo=item") Chỉnh sửa
                button.btn.btn-danger(@click="list.splice(index, 1)") Xóa
      page-tab#haravan(title="Chương trình phía Haravan")
        p ahihi
</template>
<script>
import { multiLang, d } from '../helpers/mixins'
import { get, post } from '../plugins/jquery-ajax'
import Help from '../components/help.vue'
import Upload from '../components/upload-img.vue'
import PageTabs from '../components/page-tabs.vue'
import PageTab from '../components/page-tab.vue'

const newPromo = () => ({
  title: '',
  code: '',
  url: '',
  img: d(() => null),
  behavior: 'none'
})

export default {
  page: 'promotions',
  mixins: [multiLang],
  components: { Help, Upload, PageTabs, PageTab },
  data() {
    return {
      list: [],
      newPromo: newPromo(),
      mode: 'new'
    }
  },
  methods: {
    add() {
      if (this.mode === 'new') this.list.push(this.newPromo)
      else this.mode = 'new'
      this.newPromo = newPromo()
    },
    async fetch() {
      const self = this
      const { list = [] } = await get('/meta?key=promotions')
      console.log(list)
      //patch
      await Promise.all(
        list.map(
          item =>
            new Promise(async resolve => {
              const [vi, en] = await Promise.all([
                self.patchImage(item.img.vi),
                self.patchImage(item.img.en)
              ])
              item.img.vi = vi
              item.img.en = en
              resolve()
            })
        )
      )
      this.list = list.filter(item => item.title.length > 0) || []
    },
    async save() {
      await post('/meta?key=promotions', { list: this.list })
    }
  },
  mounted() {
    this.fetch()
  }
}
</script>
<docs> ### Chua co gi het </docs>
