<style lang="scss" module>
.previews img {
  width: 70%;
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
    select-img-dialog(:show="showModal" @close="showModal=false" v-model="data.image.desktop")
    select-img-dialog(:show="showModalMobile" @close="showModalMobile=false" v-model="data.image.mobile")
</template>
<script>
import SelectImgDialog from '@client/components/select-img-dialog.vue'

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
    showModalMobile: false
  }),
  computed: {
    hasImage() {
      return this.data.image && JSON.stringify(this.data.image) !== '{}'
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
