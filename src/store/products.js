import { get, post } from '../plugins/jquery-ajax'

class Product {
  id

  static wrap(context, obj) {
    return new this(context, obj)
  }

  constructor(context, product) {
    this.context = context
    Object.assign(this, product)
  }

  updateMeta(key, value) {
    const id = this.id

    return post(`/products/${id}/${key}`, { [key]: value })
      .then(() => {
        this.context.commit('updateMeta', {
          id: this.id,
          meta: { [key]: value }
        })
      })
      .catch(e => console.error(e))
  }
}

export default {
  namespaced: true,
  state() {
    return {
      products: []
    }
  },
  getters: {
    current({ products }, {}, { route }) {
      if (route.name !== 'product.faq.item')
        return {
          title: ''
        }
      return (
        products.find(p => p.id === route.params.id * 1) || {
          title: ''
        }
      )
    },
    count({ products }) {
      return products.length
    }
  },
  mutations: {
    fetch(state, products) {
      state.products = products
    },
    updateMeta(state, { id, meta }) {
      const index = state.products.findIndex(p => p.id * 1 === id * 1)
      state.products[index].meta = Object.assign(
        {},
        state.products[index].meta,
        meta
      )
    }
  },
  actions: {
    async fetch(context, { onProgress } = {}) {
      const { commit, state } = context
      // console.log(state);
      if (state.products.length > 0) return
      const { products } = await get('/products'),
        stat = { counter: 0 },
        metaList = await Promise.all(
          products.map(p =>
            get(`/meta/products/${p.id}`).then(rs => {
              if (onProgress)
                onProgress({
                  percentage: Math.round(
                    (++stat.counter * 100) / products.length
                  )
                })
              return rs
            })
          )
        )

      products.forEach((p, i) => {
        const meta = {}
        metaList[i].forEach(m => {
          switch (m.key) {
            case 'vaithuhay-faq':
              meta.faq = JSON.parse(m.value).faq
              break
            case 'relatedArticles':
              meta.relatedArticles = JSON.parse(m.value).relatedArticles
              break
            default:
              meta[m.key] = m.value
          }
        })

        if (!meta.relatedArticles) meta.relatedArticles = []
        p.meta = meta
      })
      commit('fetch', products.map(p => Product.wrap(context, p)))
    }
  }
}
