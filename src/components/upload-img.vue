<style lang="scss" scoped>
  .form-group input {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 6em;
    outline: none;
    visibility: hidden;
    cursor: pointer;
    background-color: #c61c23;
    box-shadow: 0 0 0 5px currentColor;
    &:before {
      content: attr(data-title);
      position: absolute;
      top: 0.5em;
      left: 0;
      width: 100%;
      min-height: 6em;
      line-height: 2em;
      padding-top: 1.5em;
      opacity: 1;
      visibility: visible;
      text-align: center;
      border: 0.25em dashed currentColor;
      transition: all 0.3s cubic-bezier(.25, .8, .25, 1);
      overflow: hidden;
    }
  }

  .btn {
    &:after {
      content: attr(data-ellipsis);
      margin-left: .3em;
      visibility: visible;
    }
  }

  img {
    width: 100%;
    height: auto;
  }
</style>
<template lang="pug">
  div
    button.btn.btn-primary.btn-block(ref="btn", @click="$refs.input.click()", :data-ellipsis="ellipsis") Thêm hình ảnh
    .form-group
      label.sr-only File upload
      input.text-primary.font-weight-bold(ref="input", type="file", accept="image/*", :data-title="value$", @change="upload($event)")
    .row(v-if="value")
      .col-sm-8.offset-sm-2
        img(:src="(typeof value==='object')?value.thumbnails[thumbnail]:''")
</template>
<script>
  import {postForm} from '../plugins/jquery-ajax'

  export default {
    props: {
      value: null,
      thumbnail: {
        type: String,
        default: '600w'
      }
    },
    data() {
      return {
        ellipsis: ''
      }
    },
    computed: {
      value$() {
        if (this.value && this.value.url && this.value.url.length > 0)
          return this.value.url.split("/").pop();
        else return "Hoặc kéo thả một ảnh vào đây"
      }
    },
    methods: {
      async upload({target}) {
        if (target.files && target.files[0]) {
          const file = target.files[0],
            form = new FormData();
          let url, handle;
          form.append('img', file);
          this.$refs.btn.setAttribute('disabled', '');
          try {
            handle = setInterval(() => {
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
            }, 300);
            url = await postForm('/images', form);
          } catch ({responseJSON}) {
            await this.$store.dispatch('notifications/pushDanger', {
              title: 'Có lỗi xảy ra',
              message: `Vui lòng liên hệ với Hùng Phong để khắc phục nhé ahihu.<br /><i><strong>From server: </strong> ${responseJSON.error}</i>`
            });
          } finally {
            clearInterval(handle);
            this.ellipsis = '';
            this.$refs.btn.removeAttribute('disabled');
            if (url) {
              this.$emit('input', url);
            }
          }
        }
      }
    }
  }
</script>
