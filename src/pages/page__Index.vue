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
const newLayout = type => ({
  type,
  data: {}
})

export default {
  components: { Upload, PageSectionItem, Dropdown },
  mixins: [multiLang],
  data() {
    return {
      commit: d(() => [{ text: '' }, { text: '' }, { text: '' }, { text: '' }]),
      fanpage: '',
      slider: [],
      layout: [],
      newSlide,
      admin: {
        newLayout: {
          CollectionSlider: 'Slider danh mục',
          Promotions: 'Khuyến mãi'
        }
      }
    }
  },
  methods: {
    async get() {
      const [{ commit }, { fanpage, slider }] = await Promise.all([
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
    },
    async save() {
      await Promise.all([
        post('/settings/page/index', {
          commit: this.commit
        }),
        post('/meta?key=homepage', {
          fanpage: this.fanpage,
          slider: this.slider
        })
      ])
    },
    addNewLayout(type) {
      this.layout.push(newLayout(type))
    }
  },
  async mounted() {
    await this.get()
  }
}
</script>
