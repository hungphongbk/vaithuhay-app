import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from './pages/login.vue'
import Users from './pages/permission-and-rules.vue'
import Dashboard from './pages/dashboard.vue'
import Log from './pages/logs.vue'

Vue.use(VueRouter)
const transformSingleRoute = (fns, route) =>
    fns.reduce((r, fn) => fn(r), route),
  transformRoutes = (fns, routes) =>
    routes.map(route => transformSingleRoute(fns, route)),
  prefixFn = prefix => route => {
    route.path = prefix + route.path
    return route
  },
  roleFn = role => route => {
    route.meta = Object.assign({}, route, { role })
    return route
  }

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  transformSingleRoute([roleFn('admin')], {
    path: '/page/users',
    name: 'page.users',
    component: Users
  }),
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard
  },
  {
    path: '/page/about-us',
    name: 'page.about-us',
    component: () =>
      import(/* webpackChunkName: "page-about-us" */ './pages/page__AboutUs.vue')
  },
  {
    path: '/page/index',
    name: 'page.index',
    component: () =>
      import(/* webpackChunkName: "page-index" */ './pages/page__Index.vue')
  },
  {
    path: '/page/settings',
    name: 'page.settings',
    component: () =>
      import(/* webpackChunkName: "page-index" */ './pages/page__Settings.vue')
  },
  {
    path: '/logs',
    name: 'page.logs',
    component: Log
  },
  {
    path: '/metafields',
    name: 'page.metafields',
    component: () =>
      import(/* webpackChunkName: "page-metafields" */ './pages/metafields.js.vue')
  },
  ...transformRoutes(
    [prefixFn('/product/faq')],
    [
      {
        path: '',
        name: 'product.faq',
        component: () =>
          import(/* webpackChunkName: "product-faq" */ './pages/product__FAQ.vue')
      },
      {
        path: '/:id',
        name: 'product.faq.item',
        component: () =>
          import(/* webpackChunkName: "product-faq" */ './pages/product__FAQ-detail.vue'),
        props: true
      }
    ]
  ),
  {
    path: '/product/wholesale',
    name: 'product.wholesale',
    component: () =>
      import(/* webpackChunkName: "product-wholesale" */ './pages/product__WholeSale.vue')
  },
  {
    path: '/product/promo',
    name: 'product.promo',
    component: () =>
      import(/* webpackChunkName: "product-promo" */ './pages/product__Promotions.vue')
  },
  {
    path: '/product/relateds',
    name: 'product.relateds',
    component: () =>
      import(/* webpackChunkName: "product-relateds" */ './pages/product__Relateds.vue')
  },
  {
    path: '/cat',
    name: 'cat',
    component: () =>
      import(/* webpackChunkName: "cat" */ './pages/categories.vue')
  },
  {
    path: '/cat/:id',
    name: 'cat.detail',
    component: () =>
      import(/* webpackChunkName: "cat" */ './pages/categories-detail.vue')
  },
  ...transformRoutes(
    [prefixFn('/articles')],
    [
      {
        path: '',
        name: 'article.list',
        component: () =>
          import(/* webpackChunkName: "article" */ './pages/articles.vue')
      },
      {
        path: '/:id',
        name: 'article.item',
        component: () =>
          import(/* webpackChunkName: "article" */ './pages/articles-detail.vue'),
        props: true
      }
    ]
  ),
  ...transformRoutes(
    [prefixFn('/images')],
    [
      {
        path: '',
        name: 'images.list',
        component: () =>
          import(/* webpackChunkName: "images" */ './pages/images.vue')
      }
    ]
  ),
  {
    path: '/noti',
    name: 'page.noti',
    component: () =>
      import(/* webpackChunkName: "noti" */ './pages/push-noti.vue')
  }
]

export default new VueRouter({
  routes
})

export const pages = {
  'page.users': { title: 'Phân quyền' },
  'page.about-us': { title: 'Về chúng tôi' },
  'page.index': { title: 'Trang chủ' },
  'page.settings': { title: 'Cài đặt' },
  'product.faq': { title: 'Sản phẩm' },
  'product.wholesale': { title: 'Mua/bán sỉ' },
  'product.promo': { title: 'Khuyến mãi' },
  cat: { title: 'Danh mục sản phẩm' },
  'articles.list': { title: 'Bài viết' },
  'images.list': { title: 'Hình ảnh' },
  'page.logs': { title: 'Nhật kí' },
  'page.noti': { title: 'Thông báo đẩy' },
  'page.metafields': { title: 'Metafields' }
}
