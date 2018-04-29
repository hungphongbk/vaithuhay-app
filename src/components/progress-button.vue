<style lang="scss" scoped>
  .btn {
    min-width: 200px;
    cursor: pointer;
    &:after {
      content: attr(data-ellipsis);
      margin-left: .3em;
      visibility: visible;
    }
  }
</style>
<template lang="pug">
  button.btn(:data-ellipsis="ellipsis")
    slot
</template>
<script>
  export default {
    data() {
      return {
        inProgress: false,
        ellipsis: '',
        h: null
      }
    },
    watch: {
      inProgress(value) {
        if (value) {
          this.$el.setAttribute('disabled', '');
          this.h = setInterval(() => {
            switch (this.ellipsis.length) {
              case 0:
              case 3:
                this.ellipsis = '.';
                break;
              case 1:
                this.ellipsis = '..';
                break;
              case 2:
                this.ellipsis = '...';
                break;
            }
          }, 300)
        } else {
          clearInterval(this.h);
          this.ellipsis = '';
          this.$el.removeAttribute('disabled');
        }
      }
    }
  }
</script>
