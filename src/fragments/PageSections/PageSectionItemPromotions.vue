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
      .modal-footer
</template>
<script>
import Modal from '../../components/modal.vue'
import SelectImg from '../../components/select-img.vue'
import { d } from '@client/helpers/mixins'

const newPromo = () => ({
  title: '',
  code: '',
  url: '',
  img: d(() => null),
  behavior: 'none'
})

export default {
  components: { Modal, SelectImg },
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
  })
}
</script>
