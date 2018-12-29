<style lang="scss" scoped>
@import './header.scss';

.nav.nav-tabs {
  margin-top: 20px;
}
</style>
<style lang="scss" module="">
.faq {
}
</style>
<template lang="pug" src="./product__FAQ-detail.pug"></template>
<script>
import { multiLang, d } from '../helpers/mixins'
import { get, post, postText } from '../plugins/jquery-ajax'
import { mapState, mapGetters } from 'vuex'
import Help from '../components/help.vue'
import debounce from 'lodash/debounce'
import ArticleSelector from '../components/article-selector.vue'
import CircularJSON from 'circular-json'
import SelectImg from '@client/components/select-img.vue'

const fetch = async id =>
  Promise.all([
    get(`/products/${id}/vaithuhay-faq`),
    get(`/products/${id}/desc`),
    get(`/products/${id}/title`),
    get(`/products/${id}/relatedArticles?id=true`)
  ])

export default {
  mixins: [multiLang],
  components: { Help, ArticleSelector, SelectImg },
  data() {
    return {
      mode: 'new',
      newFAQ: d(() => ({
        ask: '',
        answer: ''
      })),
      faq: [],
      desc: d(() => ''),
      title: '',
      relatedArticles: [],
      imageSphere: null
    }
  },
  computed: {
    ...mapState({
      id: state => state.route.params.id
    }),
    ...mapGetters({
      current: 'products/current'
    }),
    currentJSON() {
      const current = { ...this.current }
      delete current.context
      // console.log(Object.getOwnPropertyNames(current))
      return CircularJSON.stringify(current, null, '    ')
    }
  },
  async beforeRouteEnter({ params }, {}, next) {
    const [{ faq }, { desc }, title, relatedArticles] = await fetch(params.id)
    next(vm => {
      vm.faq = faq || []
      vm.desc = desc || d(() => '')
      vm.title = title || ''
      vm.relatedArticles.push(...(relatedArticles || []))
      // debugger;
      console.log('fetch related articles before')
    })
  },
  async beforeRouteUpdate({ params }, {}, next) {
    const [{ faq }, { desc }, title, relatedArticles] = await fetch(params.id)
    this.faq = faq || []
    this.desc = desc || d(() => '')
    this.title = title || ''
    this.relatedArticles.push(...(relatedArticles || []))
    console.log('fetch related articles')
    next()
  },
  methods: {
    add() {
      if (this.mode === 'new') this.faq.push(this.newFAQ)
      else this.mode = 'new'
      this.newFAQ = d(() => ({
        ask: '',
        answer: ''
      }))
    },
    async save() {
      const { id, faq, desc, title, relatedArticles } = this
      await Promise.all([
        post(`/products/${id}/vaithuhay-faq`, { faq }),
        post(`/products/${id}/desc`, { desc }),
        postText(`/products/${id}/title`, title),
        this.current.updateMeta('relatedArticles', relatedArticles)
      ])
    }
  }
}
</script>
<docs>
  ### Chuyển ngôn ngữ khi soạn thảo Dùng tổ hợp phím `Ctrl` `Shift` `L`
</docs>
