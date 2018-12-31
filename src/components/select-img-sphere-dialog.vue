<style lang="scss" module>
.log {
  composes: border rounded p-1 from global;
  background: #fbfbfb;
  p {
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
    font-family: monospace;
  }
}
</style>
<template lang="pug">
  div
    modal(v-if="show" size="lg" @dismiss="$emit('close')" :title="title" :border-bottom="false")
      .modal-body.pt-0
        page-tabs(:hash="false")
          page-tab#newImage(title="Upload ảnh mới")
            .d-flex.justify-content-center(style="min-height: 200px")
              template(v-if="!value")
                upload-base.align-self-center(ref="upload" title="Tải lên video (*.mp4)" acceptTypes="video/mp4" :upload-fn="upload" btnClasses="btn-lg" :withProgress="uploading")
              template(v-else)
                image-sphere(:image="value")
            template(v-if="logs.length>0")
              div(:class="$style.log")
                p(v-for="(log,index) in logs" :key="index") {{log}}
      .modal-footer
        .btn.btn-success(@click="ok") Chọn ảnh
</template>
<script>
import UploadBase from '@client/components/UI/UploadBase.vue'
import { SOCKET_EV } from '@universal/consts'
import ImageSphere from '@vth/ImageSphere.vue'
export default {
  name: 'SelectImgSphereDialog',
  components: { ImageSphere, UploadBase },
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
    uploading: '',
    logs: []
  }),
  sockets: {
    [SOCKET_EV.Image3d.UploadProgress]({ message }) {
      const match = /(\d+%) analyzed/.exec(message)
      if (match && match[1]) {
        this.uploading = match[1]
      } else this.logs.push(message)
    },
    [SOCKET_EV.Image3d.UploadCompleted]({ imageSphere }) {
      this.$refs.upload.endUploadMark()
      this.$emit('input', imageSphere)
    }
  },
  methods: {
    upload(fileObj) {
      this.$socket.emit(SOCKET_EV.Image3d.OnUpload, fileObj)
    },
    ok() {
      this.$emit('close')
    }
  }
}
</script>
