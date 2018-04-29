<style lang="scss" scoped>
  @import "./header.scss";

  .nav.nav-tabs {
    margin-top: 20px;
  }

  .nav-item a {
    text-transform: uppercase;
  }
</style>
<template lang="pug">
  div
    div.clearfix.header
      h2.page-title Chỉnh sửa category
        small.text-muted &nbsp;({{current.title}})
      .btn.btn-default.btn-lg.btn-lang.bold(@click="switchLang") {{lang}}
      save-button(:fn="save")
    ul.nav.nav-tabs(role="tabList")
      li.nav-item
        a.nav-link.active(data-toggle="tab", role="tab", aria-controls="faq-panel", aria-selected="true", href="#slide-panel") slider
    .tab-content
      .tab-pane.fade.show.active#slide-panel
        list-management.row(v-model="slides", :new="newSlide")
          template(slot-scope="props")
            .col-sm-4
              upload(v-model="props.current.image[lang]", v-ml="lang")
              p.font-italic Kích thước hình ảnh nên là 870x470px hoặc tỉ lệ tương đương
            .col-sm-8
              .form-group
                label Đường dẫn khi click vào slide (bỏ trống nếu không cần thiết)
                input.form-control(v-model="props.current.url")
            .col-sm-12
              button.btn.btn-success(@click="props.add") {{props.mode==='new'?'Thêm Slide':'Cập nhật Slide'}}
            .col-sm-12
              hr
            .col-sm-3(v-for="(slide,index) in slides")
              .card
                img.card-img-top(:src="slide.image[lang].thumbnails['600w']")
                .card-body
                  p.text-secondary(v-if="slide.url.length>0")
                    small
                      i.fa.fa-link
                      | {{slide.url}}
                  button.btn.btn-sm.btn-secondary.mr-1(@click="props.update(slide)") Chỉnh sửa
                  button.btn.btn-sm.btn-danger(@click="slides.splice(index, 1)") Xóa
</template>
<script>
  import Upload from '../components/upload-img.vue'
  import {multiLang, d} from '../helpers/mixins'
  import {get, post} from '../plugins/jquery-ajax'
  import {mapState, mapGetters, mapActions} from 'vuex'

  const newSlide = () => ({
    image: d(() => ""),
    url: ""
  });

  export default {
    mixins: [multiLang],
    components: {Upload},
    data() {
      return {
        newSlide
      }
    },
    computed: {
      ...mapState({
        id: state => state.route.params.id
      }),
      ...mapGetters({
        current: 'categories/current'
      }),
      slides() {
        return this.current.meta.slides.list;
      }
    },
    methods: {
      ...mapActions({
        save: 'categories/save'
      })
    }
  }
</script>
