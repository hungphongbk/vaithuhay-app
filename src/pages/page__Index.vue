<style lang="scss" scoped>
@import './header.scss';
</style>
<template lang="pug" src="./page__Index.vue.pug"></template>
<script>
import { multiLang, d } from '../helpers/mixins'
import { get, post } from '../plugins/jquery-ajax'
import pick from 'lodash/pick'
import Upload from '../components/upload-img.vue'
import PageSectionItem from '../fragments/PageSections/PageSectionItem'
import Dropdown from '../components/dropdown.vue'
import uuid from 'uuid/v4'

const $ = jQuery
const newSlide = () => ({
  image: d(() => ({
    url: '',
    thumbnails: [],
    show: true
  })),
  mobile: d(() => ({
    url: '',
    thumbnails: []
  })),
  url: ''
})
const newLayout = type => {
  const id = uuid()
  return {
    id,
    type
  }
}

export default {
  components: { Upload, PageSectionItem, Dropdown },
  mixins: [multiLang],
  data() {
    return {
      commit: d(() => [{ text: '' }, { text: '' }, { text: '' }, { text: '' }]),
      fanpage: '',
      slider: [],
      layout: null,
      newSlide,
      admin: {
        newLayout: {
          CollectionSlider: 'Slider danh mục',
          Promotions: 'Khuyến mãi',
          Banner: 'Banner'
        }
      }
    }
  },
  methods: {
    async get() {
      const [{ commit }, { fanpage, slider, layout }] = await Promise.all([
        get('/settings/page/index'),
        get('/meta?key=homepage')
      ])
      Object.assign(this.commit, commit)
      this.fanpage = fanpage
      if (typeof slider !== 'undefined' && slider !== null) {
        slider.forEach(slide => {
          if (typeof slide.mobile !== 'object')
            slide.mobile = d(() => ({
              url: '',
              thumbnails: []
            }))
        })
        this.slider = slider
      }
      console.log(layout)
      if (typeof layout !== 'undefined' && layout !== null) this.layout = layout
    },
    async save() {
      await Promise.all([
        post('/settings/page/index', {
          commit: this.commit
        }),
        post('/meta?key=homepage', {
          fanpage: this.fanpage,
          slider: this.slider,
          layout: this.layout
        })
      ])
    },
    addNewLayout(type) {
      if (!this.layout) this.layout = []
      this.layout.push(newLayout(type))
    },
    updateLayoutItem(id, data) {
      const item = this.layout.find(layoutItem => layoutItem.id === id)
      item.data = data
    },
    removeLayoutItem(id) {
      const index = this.layout.findIndex(layoutItem => layoutItem.id === id)
      this.layout.splice(index, 1)
    }
  },
  async mounted() {
    await this.get()
  }
}
</script>
