<style lang="scss" module>
@import '../scss/inc/mixins';
.image {
  @include aspect-ratio(1, 1);
  flex-basis: percentage(1/5);
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .content {
    padding: 3px;
    > div {
      width: 100%;
      height: 100%;
      border: 3px solid rgba(#000, 0);
      cursor: pointer;
      position: relative;
      @at-root .remove {
        position: absolute;
        top: 0;
        right: 0;
        width: 1.18rem;
        height: 1.2rem;
        transform: translate(0.6rem, -0.6rem);
        border-radius: 50%;
        background: red;
        color: white;
        text-align: center;
        display: none;
        font-size: 1.2rem;
        line-height: 1;
      }
    }
    &:hover > div {
      border: 3px solid rgba(#000, 0.22);
      .remove {
        display: block;
      }
    }
  }
  .content.selected > div {
    border: 3px solid #007bff !important;
  }
}
</style>
<template lang="pug">
  div
    modal(v-if="show" size="lg" @dismiss="$emit('close')" :title="title")
      .modal-body
        .row
          .col-8
            template(v-if="!fetched")
              p.text-center.text-muted Đang tải...
            template(v-else-if="images.length===0")
              p.text-center.text-muted Kho ảnh rỗng.
            template(v-else)
              .d-flex
                div(:class="$style.image" v-for="image in images" :key="image._id")
                  div(:class="{ [$style.content]: true, [$style.selected]: tmpValue && tmpValue._id && image._id===tmpValue._id }" @click="tmpValue=image")
                    div
                      img(:src="image.thumbnails['300w']")
                      span(:class="$style.remove" @click="()=>deleteImage(image)") &times;
          .col-4
            upload(v-model="newImage")
      .modal-footer
        .btn.btn-success(:class="{ disabled: !tmpValue }" @click="selectImage") Chọn hình ảnh này
</template>
<script>
import Modal from '@client/components/modal.vue'
export default {
  name: 'SelectImgDialog',
  components: { Modal },
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
    ready: false,
    fetched: false,
    images: [],
    newImage: '',
    tmpValue: null
  }),
  sockets: {
    connect() {
      this.ready = true
    },
    fetchImagesCompleted({ uuid, images }) {
      if (this.uuid === uuid) {
        this.images = images
        this.fetched = true
      }
    },
    deleteImageSucceeded({ uuid, _id }) {
      if (this.uuid === uuid) {
        const index = this.images.findIndex(img => img._id === _id)
        this.images.splice(index, 1)
      }
    }
  },
  watch: {
    show(value) {
      console.log(value)
      if (value) {
        this.$socket.emit('fetchImages', { uuid: this.uuid })
        this.tmpValue = this.value
      }
    },
    newImage(value) {
      this.images.push(value)
    }
  },
  methods: {
    deleteImage({ _id }) {
      this.$socket.emit('deleteImage', { uuid: this.uuid, _id })
    },
    selectImage() {
      this.$emit('input', this.tmpValue)
      this.$emit('close')
    }
  }
}
</script>
