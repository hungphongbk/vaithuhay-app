import { mapState } from 'vuex'
import debounce from 'lodash/debounce'

export default ({ dataSource, propertyName }) => {
  const propertyName$ = `${propertyName}$`,
    propertyName$search = `${propertyName}$search`,
    propertyName$checked = `${propertyName}$checked`

  return {
    props: {
      value: {
        required: true
      },
      single: {
        type: Boolean,
        default: false
      }
    },
    data: () => ({
      keyword: ''
    }),
    computed: {
      ...mapState({
        [propertyName]: dataSource
      }),
      [propertyName$]() {
        const self = this
        return self[propertyName].map(item => ({
          ...item,
          get checked() {
            if (self.single) return self.value * 1 === item.id * 1
            return self.value.findIndex(id => id * 1 === item.id * 1) >= 0
          }
        }))
      },
      [propertyName$search]() {
        if (this.keyword === '') return this[propertyName$]
        return this[propertyName$].filter(item =>
          item.title.toLowerCase().includes(this.keyword.toLowerCase())
        )
      },
      [propertyName$checked]() {
        return this[propertyName$].filter(i => i.checked)
      }
    },
    methods: {
      toggle(_id) {
        const self = this
        if (self.single) {
          self.$emit('input', _id * 1)
        } else {
          const index = self.value.findIndex(id => id * 1 === _id)
          if (index < 0) self.value.push(_id)
          else {
            self.value.splice(index, 1)
          }
          self.$emit('input', self.value)
        }
      },
      update_: debounce(function({ target }) {
        this.keyword = target.value
      }, 300)
    }
  }
}
