<style lang="scss" module>
.previews img {
  width: 70%;
}
.editLink {
  cursor: pointer;
}
</style>
<template lang="pug">
  div.media(v-if="data")
    img.mr-3(src="../../images/icon-banner.png")
    .media-body
      h6.card-title.mb-1 Banner
        i(v-if="!hasImage") &nbsp;(Chưa có hình ảnh)
      .row(:class="$style.previews")
        .col-4
          .btn.btn-primary.btn-sm.mt-2(@click="showModal=true") Tải ảnh Banner (Desktop)
          img.mt-1(v-if="data.image.desktop && data.image.desktop.thumbnails" :src="data.image.desktop.thumbnails['300w']")
        .col-4
          .btn.btn-primary.btn-sm.mt-2(@click="showModalMobile=true") Tải ảnh Banner (Mobile)
          img.mt-1(v-if="data.image.mobile && data.image.mobile.thumbnails" :src="data.image.mobile.thumbnails['300w']")
        .col-12.pt-3
          .d-flex.align-items-center
            fa-layers(:icon="FaLink")
            i.ml-2(:class="$style.editLink" @click="showModalLink = true")
              small
                template(v-if="!data.link.url") Chưa có link
                template(v-else) {{data.link.url}}
    select-img-dialog(:show="showModal" @close="showModal=false" v-model="data.image.desktop")
    select-img-dialog(:show="showModalMobile" @close="showModalMobile=false" v-model="data.image.mobile")
    modal(v-if="showModalLink" @dismiss="showModalLink = false" title="Thiết lập đường dẫn")
      .modal-body
        form-group(title="Đường dẫn" columns="3,9")
          input.form-control(type="text" v-model="tmpLink.url")
        form-group(columns="3,9")
          .form-check
            input.form-check-input#newTab(type="checkbox" v-model="tmpLink.newTab")
            label.form-check-label(for="newTab") Mở tab mới
      .modal-footer
        .btn.btn-success(@click="showModalLink = false") OK
</template>
<script>
import SelectImgDialog from '@client/components/select-img-dialog.vue'
import FaLink from '@fortawesome/fontawesome-free-solid/faLink'

export default {
  components: { SelectImgDialog },
  props: {
    data: {
      validator: val => typeof val === 'object' || val === null,
      required: true
    }
  },
  data: () => ({
    showModal: false,
    showModalMobile: false,
    showModalLink: false,
    FaLink,
    tmpLink: {
      url: '',
      newTab: false
    }
  }),
  computed: {
    hasImage() {
      return this.data.image && JSON.stringify(this.data.image) !== '{}'
    }
  },
  watch: {
    showModalLink(value) {
      const data = { ...this.data }
      console.log(data)
      if (!value) {
        data.link = this.tmpLink
        this.$emit('update', data)
      } else if (data.link && data.link.url) {
        this.tmpLink = data.link
      }
    }
  },
  methods: {
    setDesktop(img) {
      const data = { ...this.data }
      data.image.desktop = img
      this.$emit('update', data)
    },
    setMobile(img) {
      const data = { ...this.data }
      data.image.mobile = img
      this.$emit('update', data)
    }
  },
  mounted() {
    if (!this.data) {
      this.$emit('update', {
        id: 0,
        image: {
          desktop: '',
          mobile: ''
        }
      })
    }
  }
}
</script>
