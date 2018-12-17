<template lang="pug">
  div
    .btn.btn-primary.btn-sm.mt-2(@click="showModal=true") {{title}}
    br
    img.mt-2(v-if="value && value.thumbnails" :src="value.thumbnails['300w']")
    select-img-dialog(:show="showModal" @close="showModal=false" :value="value" @input="val=>$emit('input',val)")
</template>
<script>
import SelectImgDialog from '@client/components/select-img-dialog.vue'
export default {
  components: { SelectImgDialog },
  props: {
    value: {
      type: null,
      required: true
    },
    title: {
      type: String,
      default: 'Chọn ảnh'
    }
  },
  data: () => ({
    showModal: false
  })
}
</script>
