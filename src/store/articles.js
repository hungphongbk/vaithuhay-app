import { get, post } from '../plugins/jquery-ajax'

export default {
  namespaced: true,
  state() {
    return {
      blogId: null,
      articles: []
    }
  },
  getters: {
    current({ articles }, {}, { route }) {
      if (route.name !== 'article.item')
        return {
          title: ''
        }
      return (
        articles.find(p => p.id === route.params.id * 1) || {
          title: ''
        }
      )
    }
  },
  mutations: {
    fetch(state, { articles, blogId }) {
      state.articles = articles
      state.blogId = blogId
    },
    update({ articles }, { id, key, value }) {
      const article = articles.find(i => i.id * 1 === id * 1)
      article.meta[key] = value
    }
  },
  actions: {
    async fetch({ commit, state }, { onProgress } = {}) {
      if (state.articles.length > 0) return

      const { articles } = await get('/articles'),
        blogId = articles[0]['blog_id'],
        stat = { counter: 0 },
        metaList = await Promise.all(
          articles.map(p =>
            get(`/meta/blogs/${blogId}/articles/${p.id}`).then(rs => {
              if (onProgress)
                onProgress({
                  percentage: Math.round(
                    (++stat.counter * 100) / articles.length
                  )
                })
              return rs
            })
          )
        )
      articles.reverse()
      metaList.reverse()
      articles.forEach((p, i) => {
        const meta = {}
        metaList[i].forEach(m => {
          try {
            meta[m.key] = JSON.parse(m.value)
          } catch (e) {
            meta[m.key] = m.value
          }
        })
        p.meta = meta
        // console.log(meta)
      })
      commit('fetch', { articles, blogId })
    },
    async update({ commit, state }, { id, key, value }) {
      try {
        const { blogId } = state
        await post(`/blogs/${blogId}/articles/${id}/${key}`, value)
        commit('update', { id, key, value })
      } catch (e) {
        console.log(e)
      }
    }
  }
}
