<!-- suppress ALL -->

<style lang="scss" scoped>
@import './scss/inc';

body {
  padding-top: 50px;
}

.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  overflow-x: hidden;
  overflow-y: auto;
  border-right: 1px solid #eee;
  padding: 20px 0;
  .nav {
    padding-bottom: 14px;
    margin-bottom: 14px;
    border-bottom: 1px solid lighten($gray-800, 14%);
  }
  .nav-item {
    width: 100%;
    + .nav-item {
      margin-left: 0;
    }
  }
  .nav-link {
    border-radius: 0;
    color: $light;
  }
  @at-root .clear-cache-wrapper {
    position: absolute;
    bottom: 10px;
    left: 10px;
    right: 10px;
    .btn {
      width: 100%;
      cursor: pointer;
    }
  }
  &.login {
    opacity: 0.4;
    pointer-events: none;
  }
}

.placeholders {
  padding-bottom: 3rem;
}

.placeholder img {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

main {
  padding-top: $navbar-padding-y;
}
</style>
<template lang="pug">
  .container-fluid
    .row
      nav.col-sm-3.col-md-2.sidebar.bg-dark(:class="{'login':user===null}")
        ul.nav.nav-pills.flex-column
          li.nav-item
            router-link.nav-link(:to="{name: 'dashboard'}") Dashboard
          li.nav-item
            router-link.nav-link(v-if="permissions['page.index']", :to="{name: 'page.index'}") Trang chủ
          li.nav-item
            router-link.nav-link(v-if="permissions['page.about-us']", :to="{name: 'page.about-us'}") Về chúng tôi
          li.nav-item
            router-link.nav-link(v-if="permissions['page.settings']", :to="{name: 'page.settings'}") Cài đặt
          li.nav-item
            router-link.nav-link(v-if="permissions['page.users']", :to="{name: 'page.users'}") Phân quyền
              i.fa.fa-star-o.ml-2
          li.nav-item
            router-link.nav-link(v-if="permissions['images.list']", :to="{name: 'images.list'}") Quản lý hình ảnh
          li.nav-item
            router-link.nav-link(v-if="permissions['page.logs']", :to="{name: 'page.logs'}") Nhật kí hoạt động
          li.nav-item
            router-link.nav-link(v-if="permissions['page.metafields']" :to="{name: 'page.metafields'}") Metafields
        ul.nav.nav-pills.flex-column
          li.nav-item
            router-link.nav-link(v-if="permissions['page.noti']", :to="{name: 'page.noti'}") Thông báo đẩy
          li.nav-item
            router-link.nav-link(v-if="permissions['product.faq']", :to="{name: 'product.faq'}") Danh sách sản phẩm
          li.nav-item
            router-link.nav-link(v-if="permissions['cat']", :to="{name: 'cat'}") Danh sách collections
          li.nav-item
            router-link.nav-link(v-if="permissions['product.wholesale']", :to="{name: 'product.wholesale'}") Chức năng bán sỉ
          li.nav-item
            router-link.nav-link(v-if="permissions['product.promo']", :to="{name: 'product.promo'}") Khuyến mãi
        ul.nav.nav-pills.flex-column
          li.nav-item
            router-link.nav-link(v-if="permissions['articles.list']", :to="{name: 'article.list'}") Các bài viết
        .clear-cache-wrapper
          .mb-1(v-if="permissions['page.users']")
            span.switch.switch-sm
              input#dev-mode.switch(type="checkbox", v-model="dev")
              label(for="dev-mode") DEV MODE
          .btn.btn-warning.clear-cache(v-if="permissions['page.users']", @click="clearCache")
            i.fa.fa-exclamation-triangle
            | Xóa cache
      main.col-sm-9.offset-sm-3.col-md-10.offset-md-2
        transition(name="fade")
          keep-alive
            router-view
    .modal.fade(ref="loadingModal", tabindex="-1", role="dialog")
      .modal-dialog(role="document")
        .modal-content
          .modal-header
            h5.modal-title Đang tải dữ liệu...
          .modal-body
            dl
              dd(v-for="(value, key) in preloadStatus", :class="value===false?'text-muted':'text-success'") {{preloadLabels[key].label}}
                span(v-if="value===false") &nbsp;(...{{preloadLabels[key].percentage}}%)
    notifications
    modal-manager
</template>
<script>
import { mapActions } from 'vuex'
import * as types from '@client/store/types'
import { get, post } from './plugins/jquery-ajax'
import Notifications from './components/notifications.vue'
import ModalManager from './components/modal-manager'
import { pages } from './router'
import faSync from '@fortawesome/fontawesome-free-solid/faSync'
import faCheckCircle from '@fortawesome/fontawesome-free-solid/faCheckCircle'
import chunk from 'lodash/chunk'
import { retry } from '@client/helpers'
import { endMeasureTime, startMeasureTime } from '@universal/helpers'
import AppCommands from '@client/jobs/AppCommands'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms)),
  preload = (label, percentage = 0) => ({ label, percentage }),
  progressCb = preloadLabel => ({ percentage }) =>
    (preloadLabel.percentage = percentage)

export default {
  components: { Notifications, ModalManager },
  data() {
    return {
      preloadStatus: {
        products: false,
        categories: false,
        articles: false,
        metafields: false
      },
      preloadLabels: {
        products: preload('Danh sách sản phẩm'),
        categories: preload('Danh mục sản phẩm'),
        articles: preload('Danh sách bài viết'),
        metafields: preload('Metafields')
      },
      fetchingRelated: false,
      once: false,
      cmd: null
    }
  },
  computed: {
    dev: {
      get() {
        return this.$store.getters[types.G_APP_DEV_MODE]
      },
      set(value) {
        this.$store.commit(types.M_APP_TOGGLE_DEV_MODE, value)
      }
    },
    user() {
      return this.$store.state.auth.user
    },
    permissions() {
      const user = this.$store.getters['auth/currentUser'],
        perm = {}
      if (!user) return perm
      Object.keys(pages).forEach(p => {
        perm[p] = !!user.permissions.find(up => up === p)
      })
      return perm
    }
  },
  provide() {
    const socketCmd = {}
    Object.defineProperty(socketCmd, 'cmd', {
      enumerable: true,
      get: () => this.cmd
    })
    return { socketCmd }
  },
  methods: {
    ...mapActions({
      productsFetch$: 'products/fetch',
      categoriesFetch$: 'categories/fetch',
      articlesFetch$: 'articles/fetch',
      configFetch: 'loadConfig',
      checkLogin: 'auth/checkLogin'
    }),
    async productsFetch() {
      await this.productsFetch$({
        onProgress: progressCb(this.preloadLabels.products)
      })
      this.preloadStatus.products = true
    },
    async categoriesFetch() {
      await this.categoriesFetch$()
      this.preloadStatus.categories = true
    },
    async articlesFetch() {
      await this.articlesFetch$({
        onProgress: progressCb(this.preloadLabels.articles)
      })
      this.preloadStatus.articles = true
    },
    metafieldsFetch() {
      this.$socket.emit('getMetafields')
    },
    async autoSyncTopProduct() {
      const { diff } = await get('/g/lastUpdated?q=topProduct')
      if (diff > 2000 * 3600) {
        await this.$store.dispatch('notifications/pushInfo', {
          message: {
            render(h) {
              return (
                <p>
                  <fa-icon class="mr-1" icon={faSync} spin />
                  Tự động cập nhật sản phẩm Top...
                </p>
              )
            }
          },
          async callback(noti) {
            await post('/g/top')
            noti.updateMessage.call(noti, {
              render(h) {
                return (
                  <p>
                    <fa-icon class="mr-1" icon={faCheckCircle} />
                    Cập nhật hoàn tất :)
                  </p>
                )
              }
            })
          }
        })
      }
    },
    async autoSyncRelatedProducts() {
      const self = this
      if (self.fetchingRelated) return
      self.fetchingRelated = true
      const allProducts = self.$store.state.products.products,
        { diff } = await get('/g/lastUpdated?q=relatedProduct')
      if (diff < 2000 * 3600) return

      await self.$store.dispatch('notifications/pushInfo', {
        metadata: {
          count: ''
        },
        message: {
          functional: true,
          render(h, { props }) {
            return (
              <p>
                <fa-icon class="mr-1" icon={faSync} spin />
                Tự động cập nhật sản phẩm liên quan (
                <span>{props.metadata.count}</span>)...
              </p>
            )
          }
        },
        async callback(noti) {
          let done = 0
          noti.updateMeta({ count: `0/${allProducts.length}` })
          for (const products of chunk(allProducts, 2)) {
            await Promise.all(
              products.map(p => retry(post, [`/g/relateds?id=${p.id}`], 3))
            )
            done += 2
            noti.updateMeta({ count: `${done}/${allProducts.length}` })
          }
          await post('/g/lastUpdated?q=relatedProduct')

          noti.updateMessage({
            functional: true,
            render(h) {
              return (
                <p>
                  <fa-icon class="mr-1" icon={faCheckCircle} />
                  Cập nhật hoàn tất :)
                </p>
              )
            }
          })
        }
      })
    },
    async clearCache() {
      await post('/c/reset')
      location.reload(true)
    }
  },
  async mounted() {
    this.$store.subscribe(async ({ type, payload }) => {
      // console.log(type, payload);
      if (
        type === 'auth/updateUserStatus' &&
        payload.isLoggedIn === true &&
        !this.once
      ) {
        this.once = true
        $(this.$refs.loadingModal).modal({
          backdrop: 'static',
          keyboard: false
        })
        // start measure time
        const handler = startMeasureTime()
        await this.configFetch()
        await Promise.all([
          this.metafieldsFetch(),
          this.productsFetch(),
          this.categoriesFetch(),
          this.articlesFetch()
        ])
        endMeasureTime(handler, elapsed => {
          console.info(`Preload consumes ${elapsed} seconds`)
        })
        await delay(500)
        $(this.$refs.loadingModal).modal('hide')
        $(document.body).removeClass('modal-open')
        $('.modal-backdrop').remove()
        await delay(100)

        this.cmd = AppCommands.register(this)

        // await this.autoSyncTopProduct()
        // await this.autoSyncRelatedProducts()
      }
      if (type === 'SOCKET_getMetafieldsCompleted') {
        this.preloadStatus.metafields = true
      }
    })
    await this.checkLogin()
  }
}
</script>
