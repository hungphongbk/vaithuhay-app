<style lang="scss" scoped>
</style>
<template lang="pug">
  div
    textarea(ref="editor")
</template>
<script>
  import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';

  import Enter from '@ckeditor/ckeditor5-enter/src/enter';
  import Typing from '@ckeditor/ckeditor5-typing/src/typing';
  import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
  import Undo from '@ckeditor/ckeditor5-undo/src/undo';
  import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
  import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
  import Image from '@ckeditor/ckeditor5-image/src/image';

  export default {
    data() {
      return {
        editor: null
      }
    },
    async mounted() {
      this.editor = await ClassicEditor.create(this.$refs.editor, {
        plugins: [Enter, Typing, Paragraph, Undo, Bold, Italic, Image],
        toolbar: ['bold', 'italic', 'undo', 'redo']
      });
    }
  }
</script>
