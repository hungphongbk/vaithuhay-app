import {get, post} from '../plugins/jquery-ajax'

export default {
  namespaced: true,
  state() {
    return {
      products: []
    }
  },
  getters: {
    current({products}, {}, {route}) {
      if (route.name !== 'product.faq.item') return {
        title: ''
      };
      return products.find(p => p.id === route.params.id * 1) || {
        title: ''
      }
    },
    count({products}) {
      return products.length;
    }
  },
  mutations: {
    fetch(state, products) {
      state.products = products;
    }
  },
  actions: {
    async fetch({commit, state}, {onProgress} = {}) {
      // console.log(state);
      if (state.products.length > 0) return;
      const {products} = await get('/products'),
        stat = {counter: 0},
        metaList = await Promise.all(
          products.map(p => get(`/meta/products/${p.id}`)
            .then(rs => {
              if (onProgress) onProgress({
                percentage: Math.round((++stat.counter) * 100 / products.length)
              });
              return rs;
            }))
        );

      products.forEach((p, i) => {
        const meta = {};
        metaList[i].forEach(m => {
          switch (m.key) {
            case 'vaithuhay-faq':
              meta.faq = JSON.parse(m.value).faq;
              break;
            default:
              meta[m.key] = m.value;
          }
        });
        p.meta = meta;
      });
      commit('fetch', products);
    }
  }
}
