<template lang="pug">
  div.media(v-if="data")
    img.mr-3(src="../../images/icon-banner.png")
    .media-body
      h6.card-title.mb-1 Banner
        i(v-if="!hasImage") &nbsp;(Chưa có hình ảnh)
      .btn.btn-primary.btn-sm.mt-2(@click="showModal=true") Tải ảnh Banner
    select-img-dialog(:show="showModal" @close="showModal=false")
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
    showModal: false
  }),
  computed: {
    hasImage() {
      return this.data.image && JSON.stringify(this.data.image) !== '{}'
    }
  },
  mounted() {
    if (!this.data) {
      this.$emit('update', {
        id: 0,
        image: {}
      })
    }
  }
}
</script>
