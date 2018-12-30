<style lang="scss" module>
.formGroup {
  composes: form-group from global;
  input#upload {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 6em;
    outline: none;
    visibility: hidden;
    cursor: pointer;
    background-color: #c61c23;
    box-shadow: 0 0 0 5px currentColor;
  }
}
.container {
  :global(.btn) {
    &:after {
      content: attr(data-ellipsis);
      margin-left: 0.3em;
      visibility: visible;
    }
  }
}
</style>
<template lang="pug">
  div(:class="$style.container")
    button.btn.btn-primary.btn-block(:class="btnClasses" @click="$refs.input.click()" :data-ellipsis="ellipsis") {{title}}
      template(v-if="withProgress.length>0") ({{withProgress}})
    div(:class="$style.formGroup")
      label.sr-only(:for="$style.upload") File Upload
      input.text-primary.font-weight-bold(:id="$style.upload" ref="input" type="file" :accept="acceptTypes" @change="upload($event)")
</template>
<script>
export default {
  name: 'UploadBase',
  props: {
    title: {
      type: String,
      required: true
    },
    acceptTypes: {
      type: String,
      required: true
    },
    uploadFn: {
      type: Function,
      required: true
    },
    btnClasses: {
      type: String,
      default: ''
    },
    withProgress: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    uploadHandle: null,
    ellipsis: ''
  }),
  methods: {
    beginUploadMark() {
      this.uploadHandle = setInterval(() => {
        switch (this.ellipsis.length) {
          case 0:
          case 3:
            this.ellipsis = '.'
            break
          case 1:
            this.ellipsis = '..'
            break
          case 2:
            this.ellipsis = '...'
            break
        }
      }, 300)
    },
    endUploadMark() {
      clearInterval(this.uploadHandle)
      this.ellipsis = ''
    },
    async upload({ target }) {
      this.beginUploadMark()

      // tuning target.files into filename and buf
      if (!(target.files && target.files[0])) return
      const readFile = file =>
        new Promise(resolve => {
          // console.log('read file name' + file.name)
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.readAsArrayBuffer(file)
        })
      const file = target.files[0],
        filename = file.name,
        buf = Buffer.from(new Uint8Array(await readFile(file)))
      this.uploadFn({ filename, buf })
    }
  }
}
</script>
