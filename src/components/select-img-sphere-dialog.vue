<style lang="scss" module></style>
<template lang="pug">
  div
    modal(v-if="show" size="lg" @dismiss="$emit('close')" :title="title" :border-bottom="false")
      .modal-body.pt-0
        page-tabs(:hash="false")
          page-tab#newImage(title="Upload ảnh mới")
            .d-flex.justify-content-center(style="min-height: 200px")
              template(v-if="!value && !uploading")
                upload-base.align-self-center(title="Tải lên video (*.mp4)" acceptTypes="video/mp4" btnClasses="btn-lg")
              template(v-else)
</template>
<script>
import UploadBase from '@client/components/UI/UploadBase.vue'
export default {
  name: 'SelectImgSphereDialog',
  components: { UploadBase },
  props: {
    title: {
      type: String,
      default: 'Chọn hình ảnh'
    },
    show: {
      type: Boolean,
      required: true
    },
    value: {
      type: Object,
      default: () => null
    }
  },
  data: () => ({
    uploading: false
  })
}
</script>
