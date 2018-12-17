<style lang="scss" module>
.cmd {
  cursor: pointer;
  font-weight: 700;
}
.current {
  background: #fafafa;
}
</style>
<template lang="pug">
  div.media
    img.mr-3(src="../../images/icon-discount.png")
    .media-body
      h6.card-title Khuyến mãi
      .btn.btn-primary.btn-sm(@click="showModal = true") Chỉnh sửa
    modal(v-if="showModal" size="lg" title="Chỉnh sửa mục khuyến mãi" @dismiss="showModal = false")
      .modal-body
        .row
          .col-5
            display-guard(:conditional="tmpList.length>0" text="Chưa có CTKM nào!")
              .mb-2(v-for="(item,index) in tmpList" :key="item.id")
                horizontal-item(:img="item.img[lang].thumbnails['300w']" :selected="item.id===newPromo.id")
                  h6(v-if="item.code.length>0") {{item.code}}
                  p
                    strong {{index+1}}. {{item.title}}
                  p.text-right.mb-0
                    span.text-secondary(:class="$style.cmd" @click="()=>edit(item)") Edit&nbsp;
                    span.text-danger(:class="$style.cmd") Delete
          .col-7
            form-group(title="Tên chương trình khuyến mãi")
              input.form-control(v-model="newPromo.title")
            form-group(title="Khi click vào ô khuyến mãi")
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
            form-group(v-if="newPromo.behavior==='copy'" title="Mã khuyến mãi")
              input.form-control(v-model="newPromo.code")
            form-group(v-if="newPromo.behavior==='redirect'" title="Đường dẫn khi click vào ô khuyến mãi")
              input.form-control(v-model="newPromo.url")
            .form-group
              select-img(v-model="newPromo.img[lang]" title="Chọn ảnh CT Khuyến mãi")
            .form-group
              .btn.btn-success(@click="add") {{mode==='new'?'Thêm CT khuyến mãi':'Cập nhật'}}
      .modal-footer
        .btn.btn-success OK
</template>
<script>
import Modal from '../../components/modal.vue'
import SelectImg from '../../components/select-img.vue'
import HorizontalItem from '@client/components/HorizontalItem/HorizontalItem'
import { d, multiLang } from '@client/helpers/mixins'
import uuid from 'uuid/v4'

const newPromo = () => ({
  id: uuid(),
  title: '',
  code: '',
  url: '',
  img: d(() => null),
  behavior: 'none'
})

export default {
  components: { Modal, SelectImg, HorizontalItem },
  mixins: [multiLang],
  props: {
    data: {
      validator: val => typeof val === 'object' || val === null,
      required: true
    }
  },
  data: () => ({
    showModal: false,
    newPromo: newPromo(),
    tmpList: [],
    mode: 'new'
  }),
  methods: {
    add() {
      if (this.mode === 'new') this.tmpList.push(this.newPromo)
      else this.mode = 'new'
      this.newPromo = newPromo()
    },
    edit(item) {
      this.mode = 'update'
      this.newPromo = item
    }
  }
}
</script>
