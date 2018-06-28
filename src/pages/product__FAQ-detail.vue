<style lang="scss" scoped>
  @import "./header.scss";

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
  import {multiLang, d} from "../helpers/mixins"
  import {get, post, postText} from '../plugins/jquery-ajax'
  import {mapState, mapGetters} from 'vuex'
  import Help from '../components/help.vue'
  import debounce from 'lodash/debounce'
  import ArticleSelector from '../components/article-selector.vue'

  const fetch = async id => Promise.all([
    get(`/products/${id}/vaithuhay-faq`),
    get(`/products/${id}/desc`),
    get(`/products/${id}/title`)
  ]);

  export default {
    mixins: [multiLang],
    components: {Help, ArticleSelector},
    data() {
      return {
        mode: 'new',
        newFAQ: d(() => ({
          ask: "",
          answer: ""
        })),
        faq: [],
        desc: d(() => ""),
        title: "",
        relatedArticles:[]
      }
    },
    computed: {
      ...mapState({
        id: state => state.route.params.id
      }),
      ...mapGetters({
        current: 'products/current'
      })
    },
    async beforeRouteEnter({params}, {}, next) {
      const [{faq}, {desc}, title] = await fetch(params.id);
      next(vm => {
        vm.faq = faq || [];
        vm.desc = desc || d(() => "");
        vm.title = title || "";
      })
    },
    async beforeRouteUpdate({params}, {}, next) {
      const [{faq}, {desc}, title] = await fetch(params.id);
      this.faq = faq || [];
      this.desc = desc || d(() => "");
      this.title = title || "";
      next();
    },
    methods: {
      add() {
        if (this.mode === 'new')
          this.faq.push(this.newFAQ);
        else this.mode = 'new';
        this.newFAQ = d(() => ({
          ask: "",
          answer: ""
        }));
      },
      async save() {
        const {id, faq, desc, title} = this;
        await Promise.all([
          post(`/products/${id}/vaithuhay-faq`, {faq}),
          post(`/products/${id}/desc`, {desc}),
          postText(`/products/${id}/title`, title)
        ])
      }
    }
  }
</script>
<docs>
  ### Chuyển ngôn ngữ khi soạn thảo
  Dùng tổ hợp phím `Ctrl` `Shift` `L`
</docs>
