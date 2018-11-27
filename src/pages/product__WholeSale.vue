<style lang="scss" scoped>
@import './header.scss';

.current {
  background: darken(#fff, 5%);
  /*font-weight: 600;*/
}

.count {
  float: right;
  width: 20%;
}

.rule-item {
  img {
    width: 80px;
  }
}
</style>
<template lang="pug" src="./product__WholeSale.pug"></template>
<script>
import { multiLang, d } from '../helpers/mixins'
import { get, post } from '../plugins/jquery-ajax'
import debounce from 'lodash/debounce'
import Help from '../components/help.vue'
import ProductSelector from '../components/product-selector.vue'
import ProductSelectorModal from '../components/product-selector-modal.vue'
import domToImage from 'dom-to-image'
import uuid from 'uuid/v4'
// import copy from 'copy-to-clipboard'

const newRule = () => ({
  id: uuid(),
  type: 'wholesale',
  number: 0,
  unit: 'percentage',
  amount: 0,
  additional: [],
  buy: [],
  buyNumber: 0,
  title: d(() => ''),
  description: d(() => '')
})

const mapLabels = {
  wholesale: 'Bán sỉ',
  buy1get1: 'Mua X tặng Y',
  buy1and1get1: 'Mua X & Y tặng Z'
}

export default {
  mixins: [multiLang],
  components: { Help, ProductSelector, ProductSelectorModal },
  filters: {
    label: value => mapLabels[value],
    thumbnail: ({ images }) => images[0].src.replace('http:/', 'https:/')
  },
  data() {
    return {
      products: [],
      wholesale: [],
      current: null,
      newWholesale: {
        name: '',
        rules: [],
        apply: []
      },
      newRule: newRule(),
      currentRule: null,
      keyword: '',
      copy: null
    }
  },
  computed: {
    products$() {
      const self = this
      return self.products.map(p => ({
        ...p,
        get checked() {
          return self.current.apply.findIndex(id => id * 1 === p.id) >= 0
        }
      }))
    },
    products$search() {
      if (this.keyword === '') return this.products$
      return this.products$.filter(p => p.title.includes(this.keyword))
    },
    products$checked() {
      return this.products$.filter(p => p.checked)
    }
  },
  methods: {
    add() {
      this.wholesale.push(this.newWholesale)
      this.current = this.newWholesale
      this.newWholesale = {
        name: '',
        rules: [],
        apply: []
      }
    },
    addRule() {
      if (this.currentRule) this.currentRule = null
      else this.current.rules.push(this.newRule)
      this.newRule = newRule()
    },
    async get() {
      const { data } = await get('/settings/products/wholesale')
      this.wholesale = data.map(item => {
        if (!item.type) item.type = 'wholesale'
        if (!item.rules) item.rules = []
        item.rules.forEach(rule => {
          if (!rule.id) rule.id = uuid()
          if (!rule.title) rule.title = d(() => '')
          if (!rule.description || typeof rule.description === 'string')
            rule.description = d(() => '')
          if (!rule.additional) rule.additional = []
          if (!rule.buy) rule.buy = []
          if (!rule.buyNumber) rule.buyNumber = 0
        })
        if (!item.apply) item.apply = []
        return item
      })
    },
    async save() {
      await post('/settings/products/wholesale', { data: this.wholesale })
    },
    update_: debounce(function({ target }) {
      this.keyword = target.value
    }, 300),
    toggle(_id) {
      const self = this,
        index = self.current.apply.findIndex(id => id * 1 === _id)
      if (index < 0) self.current.apply.push(_id)
      else {
        console.log(index)
        self.current.apply.splice(index, 1)
      }
    },
    copyHtml({ id }, index) {
      domToImage
        .toJpeg(this.$refs.rules[index], {
          quality: 0.7,
          filter: node => !$(node).hasClass('btn')
        })
        .then(dataUrl => {
          const embed = {
            apply: this.current.apply[0],
            rule: id
          }
          this.copy = `<img data-vaithuhay-embed-type='wholesale' data-vaithuhay-embed='${JSON.stringify(
            embed
          )}' src='${dataUrl}'>`
          // copy(this.copy)
        })
    }
  },
  async mounted() {
    const { products } = await get('/products?fields=id,title')
    this.products = products
    await this.get()
  }
}
</script>
<docs>
  ### Chuyển ngôn ngữ khi soạn thảo Dùng tổ hợp phím `Ctrl` `Shift` `L` ### Thêm
  mới chính sách bán sỉ > Trang này được thiết kế giống với trang backend
  (https://vai-thu-hay-i-something-nice.myharavan.com/admin/app#/embed/ea0ecb2908d920fba34d52ea8b8a334a).
  Vì không đồng bộ tự động được với dữ liệu phía backend, nên cần tạo các chính
  sách đồng bộ với backend một cách thủ công (tên chính sách, số sản phẩm áp
  dụng và mức chiết khấu tương ứng) Ở cột bên trái, khung **Tạo mới chính sách
  bán sỉ**, nhập tên chính sách và nhấn `OK`. Nhân vào một chính sách bất kì ở
  cột bên trái để chỉnh sửa. ### Cập nhật chính sách bán sỉ #### Tab **Chi
  tiết** Bên trái để thêm mới mức chiết khấu/chỉnh sửa mức chiết khấu có sẵn.
  Bên phải là danh sách các mức chiết khấu * Ở chế độ thêm mới, nhấn `OK` sẽ
  thêm một mức chiết khấu vào danh sách bên phải. * Chọn một mức chiết khấu bên
  phải sẽ vào chế độ chỉnh sửa. Phần mô tả mức chiết khấu cho phép đa ngôn ngữ.
  Sau khi nhấn `OK`, tự động chuyển sang chế độ thêm mới. #### Tab **Áp dụng**
  Chọn thủ công từng sản phẩm được áp dụng chiết khẩu. Tìm sản phẩm ở phần bên
  trái, nhấn vào để áp dụng hoặc hủy áp dụng (danh sách được áp dụng tự động
  xuất hiện bên phải) ### Lưu chính sách bán sỉ Trước khi tắt ứng dụng, nhấn
  `Save`
</docs>
