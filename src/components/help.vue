<style lang="scss"></style>
<template lang="pug">
  div
    button.btn.btn-outline-info.btn-lg.rounded-circle(data-toggle="modal", data-target="#modal")
      i.fa.fa-question
    .modal.fade#modal(tabindex="-1", role="dialog", aria-hidden="true")
      .modal-dialog.modal-lg
        .modal-content
          .modal-header
            h5.modal-title Trợ giúp
            button.close(type="button", data-dismiss="modal", aria-label="Close")
              span(aria-hidden="true") &times;
          .modal-body(v-html="docs")
</template>
<script>
export default {
  props: {
    docs: String
  }
}
</script>
