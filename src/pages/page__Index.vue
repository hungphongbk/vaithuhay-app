<style lang="scss" scoped>
  @import "./header.scss";
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Home
      .btn.btn-default.btn-lg.btn-lang.bold(@click="switchLang") {{lang}}
      save-button(:fn="save")
    page-tabs
      page-tab#slide-panel(title="slider")
        list-management.row(v-model="slider", :new="newSlide")
          template(slot-scope="props")
            .col-sm-4
              label
                i.fa.fa-desktop.fa-lg.mr-2
                | Phiên bản Desktop
              upload(v-model="props.current.image[lang]", v-ml="lang")
              p.font-italic Kích thước hình ảnh nên là 870x470px hoặc tỉ lệ tương đương
            .col-sm-4
              label
                i.fa.fa-mobile.fa-lg.mr-2
                | Phiên bản Mobile
              upload(v-model="props.current.mobile[lang]", v-ml="lang")
              p.font-italic Tỉ lệ hình ảnh nên là 5:4
            .col-sm-8
              .form-group
                label Đường dẫn khi click vào slide (bỏ trống nếu không cần thiết)
                input.form-control(v-model="props.current.url")
            .col-sm-12
              button.btn.btn-success(@click="props.add") {{props.mode==='new'?'Thêm Slide':'Cập nhật Slide'}}
            .col-sm-12
              hr
            draggable.col-sm-12(v-model="slider")
              transition-group.row(tag="div")
                .col-sm-3(v-for="(slide,index) in slider", :key="index")
                  .card
                    img.card-img-top(:src="slide.image[lang].thumbnails?slide.image[lang].thumbnails['600w']:''")
                    .card-body
                      p.text-secondary(v-if="slide.url.length>0")
                        small
                          i.fa.fa-link
                          | {{slide.url}}
                      button.btn.btn-secondary.mr-1(@click="props.update(slide)") Chỉnh sửa
                      button.btn.btn-danger(@click="slider.splice(index, 1)") Xóa
      page-tab#other-panel(title="Cam kết & thông tin khác")
        h4 Cam kết của chúng tôi
        .row
          .col-sm-6(v-for="(c,index) in commit[lang]")
            .form-group
              label Cam kết {{index + 1}}
              input.form-control(type="text", v-model="c.text")
        br
        h4 Thông tin khác
        .row
          .col-sm-6
            .form-group
              label Link Fanpage
              input.form-control(type="text", v-model="fanpage")
</template>
<script>
  import {multiLang, d} from "../helpers/mixins"
  import {get, post} from '../plugins/jquery-ajax'
  import pick from 'lodash/pick'
  import Upload from '../components/upload-img.vue'

  const $ = jQuery;
  const newSlide = () => ({
    image: d(() => ({
      url: "",
      thumbnails: [],
      show: true
    })),
    mobile: d(() => ({
      url: "",
      thumbnails: []
    })),
    url: ""
  });

  export default {
    mixins: [multiLang],
    components: {Upload},
    data() {
      return {
        commit: d(() => [
          {text: ''},
          {text: ''},
          {text: ''},
          {text: ''}
        ]),
        fanpage: "",
        slider: [],
        newSlide
      }
    },
    methods: {
      async get() {
        const [{commit}, {fanpage, slider}] = await Promise.all([
          get('/settings/page/index'),
          get('/meta?key=homepage')
        ]);
        Object.assign(this.commit, commit);
        this.fanpage = fanpage;
        if (typeof slider !== 'undefined' && slider !== null) {
          slider.forEach(slide => {
            if (typeof slide.mobile !== 'object')
              slide.mobile = d(() => ({
                url: '',
                thumbnails: []
              }))
          })
          this.slider = slider;
        }
      },
      async save() {
        await Promise.all([
          post('/settings/page/index', {
            commit: this.commit
          }),
          post('/meta?key=homepage', {
            fanpage: this.fanpage,
            slider: this.slider
          })
        ])
      }
    },
    async mounted() {
      await this.get();
    }
  }
</script>
