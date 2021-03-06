<style lang="scss" module>
.container {
  &,
  canvas {
    width: 100%;
  }
}
</style>
<template lang="pug">
  div(:class="$style.container" :style="preview")
    canvas(ref="canvas" :height="image.size.height" :width="image.size.width" @mousedown="onDragStart($event)" @mousemove="onDragging($event)" @mouseup="drag = false")
</template>
<script>
import JSZip from 'jszip'
export default {
  name: 'ImageSphere',
  props: {
    image: {
      type: Object,
      required: true
    },
    type: {
      type: String,
      default: 'zip'
    }
  },
  data: () => ({
    fetched: false,
    progress: 0,
    ctx: null,
    imgs: [],
    deg: -1,
    drag: false,
    dragStart: 0,
    dragEnd: 0,
    dragThreshold: 0.67
  }),
  computed: {
    preview() {
      if (!this.fetched) {
        return {
          background: `url(${this.image.urls[0]})`,
          backgroundSize: 'cover',
          filter: 'blur(11px)'
        }
      }
      return {}
    }
  },
  watch: {
    deg(deg) {
      const total = this.imgs.length,
        index = Math.ceil((deg * total) / 360) % total,
        { width, height } = this.image.size

      this.ctx.clearRect(0, 0, width, height)
      // console.log(index)
      this.ctx.drawImage(this.imgs[index], 0, 0)
    }
  },
  methods: {
    fetchNone() {
      let { image } = this,
        total = image.urls.length,
        proceeded = 0,
        loadImage = url =>
          new Promise(resolve => {
            const img = new Image()
            img.onload = () => {
              this.progress = Math.round((++proceeded * 100) / total)
              resolve(img)
            }
            console.log(this.progress)
            img.src = url
          })
      return Promise.all(image.urls.map(loadImage))
    },
    fetchZip() {
      const { image } = this
      return fetch(image.zipUrl, { mode: 'cors' })
        .then(response => {
          if (response.status === 200 || response.status === 0) {
            return Promise.resolve(response.blob())
          } else {
            return Promise.reject(new Error(response.statusText))
          }
        })
        .then(JSZip.loadAsync)
        .then(zipFile => {
          const blobs = []
          zipFile.forEach(imgPath => {
            blobs.push(zipFile.file(imgPath).async('blob'))
          })
          return Promise.all(blobs)
        })
        .then(blobs => Promise.all(blobs.map(blob => createImageBitmap(blob))))
    },
    fetch() {
      const fn = {
        none: this.fetchNone,
        zip: this.fetchZip
      }[this.type]
      fn.call(this).then(imgs => {
        this.imgs = imgs
        this.initCanvas()
      })
    },
    initCanvas() {
      this.ctx = this.$refs.canvas.getContext('2d')
      this.deg = 0
      this.fetched = true
    },
    onDragStart(event) {
      this.dragStart = event.pageX - this.$refs.canvas.offsetLeft
      this.drag = true
    },
    onDragging(event) {
      let deg = this.deg
      if (this.drag) {
        this.dragEnd = event.pageX - this.$refs.canvas.offsetLeft
        deg += (this.dragEnd - this.dragStart) * this.dragThreshold
        if (deg < 0) deg += 360
        else if (deg > 360) deg -= 360
        this.deg = deg
        this.dragStart = this.dragEnd
      }
    }
  },
  mounted() {
    this.fetch()
    if (true) {
      window.ImageSphere = {
        reset: () => {
          this.fetched = false
          this.fetch()
        }
      }
    }
  }
}
</script>
