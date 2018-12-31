<template lang="pug">
  div
    .btn.btn-primary.btn-sm.mt-2(@click="showModal=true") {{title}}
    .btn.btn-danger.btn-sm.mt-2.ml-2(v-if="allowRemove" @click="$emit('input', null)") Xoá ảnh
    br
    img.mt-2(v-if="value && value.thumbnails" :src="value.thumbnails['300w']")
    component(:is="dlgComponent" :show="showModal" @close="showModal=false" :value="value" @input="val=>$emit('input',val)")
</template>
<script>
import SelectImgDialog from '@client/components/select-img-dialog.vue'
import SelectImgSphereDialog from '@client/components/select-img-sphere-dialog.vue'
export default {
  props: {
    value: {
      type: null,
      required: true
    },
    title: {
      type: String,
      default: 'Chọn ảnh'
    },
    sphere: {
      type: Boolean,
      default: false
    },
    allowRemove: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    showModal: false
  }),
  computed: {
    dlgComponent() {
      return this.sphere ? SelectImgSphereDialog : SelectImgDialog
    }
  }
}
</script>
