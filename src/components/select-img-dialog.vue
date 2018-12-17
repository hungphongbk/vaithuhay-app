<style lang="scss" module>
@import '../scss/inc/mixins';
.container :global(.modal-lg) {
  max-width: 1000px;
}
.image {
  @include aspect-ratio(1, 1);
  flex-basis: percentage(1/6);
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
.uploadPanel {
  background: #f6f6f6;
  border: 1px solid #eee;
  border-radius: 0.7rem;
  padding: 1rem;
  margin-bottom: 1rem;
}
.info {
  table {
    width: 100%;
    max-width: 100%;
    word-break: break-word;
  }
  table tr td:first-child {
    padding-right: 1.3rem;
    word-break: keep-all;
  }
}
</style>
<template lang="pug">
  div(:class="$style.container")
    modal(v-if="show" size="lg" @dismiss="$emit('close')" :title="title")
      .modal-body
        .row
          .col-8
            template(v-if="!fetched")
              p.text-center.text-muted Đang tải...
            template(v-else-if="images.length===0")
              p.text-center.text-muted Kho ảnh rỗng.
            template(v-else)
              .d-flex.flex-wrap
                div(:class="$style.image" v-for="image in images" :key="image._id")
                  div(:class="{ [$style.content]: true, [$style.selected]: tmpValue && tmpValue._id && image._id===tmpValue._id }" @click="tmpValue=image")
                    div
                      img(:src="image.thumbnails['300w']")
                      span(:class="$style.remove" @click="()=>deleteImage(image)") &times;
          .col-4
            div(:class="$style.uploadPanel")
              upload(v-model="newImage" :preview="tmpValue" :showPreview="false")
            img.img-fluid(:src="tmpValue && tmpValue.thumbnails && tmpValue.thumbnails['300w']")
            div.mt-4(v-if="tmpValue && tmpValue.thumbnails" :class="$style.info")
              h6 Thông tin tệp ảnh
              table
                tr
                  td Tên
                  td.text-primary <i>{{tmpValue.filename}}</i>
      .modal-footer
        .btn.btn-success(:class="{ disabled: !tmpValue }" @click="selectImage") Chọn hình ảnh này
</template>
<script>
import Modal from '@client/components/modal.vue'
import { mapState } from 'vuex'
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
    newImage: '',
    tmpValue: null
  }),
  computed: {
    ...mapState({
      images: state => state.images.images,
      stat: state => state.images.stat,
      fetched: state => state.images.loaded
    })
  },
  watch: {
    show(value) {
      if (value) {
        this.tmpValue = this.value
      }
    },
    newImage(value) {
      if (value !== '') {
        this.images.push(value)
        this.newImage = ''
      }
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
  },
  mounted() {
    if (!this.fetched) {
      this.$socket.emit('fetchImages')
    }
  }
}
</script>
