<style lang="scss" module></style>
<template lang="pug">
  div
    modal(v-if="show" size="lg" @dismiss="$emit('close')" :title="title" :border-bottom="false")
      .modal-body.pt-0
        page-tabs(:hash="false")
          page-tab#newImage(title="Upload ảnh mới")
</template>
<script>
export default {
  name: 'SelectImgSphereDialog',
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
  }
}
</script>
