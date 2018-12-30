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
</style>
<template lang="pug">
  div
    button.btn.btn-primary.btn-block(:class="btnClasses") {{title}}
      template(v-if="withProgress>-1") {{withProgress}}
    div(:class="$style.formGroup")
      label.sr-only(:for="$style.upload") File Upload
      input.text-primary.font-weight-bold(:id="$style.upload" ref="input" type="file" :accept="acceptTypes")
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
    btnClasses: {
      type: String,
      default: ''
    },
    withProgress: {
      type: Number,
      default: -1
    }
  }
}
</script>
