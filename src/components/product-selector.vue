<style lang="scss" scoped>
  .current {
    background: darken(#fff, 5%);
    font-weight: 600;
  }

  .list-group-item, button.close {
    cursor: pointer;
  }
</style>
<template lang="pug">
  div
    div(:class="colCls")
      input.form-control(type="text", placeholder="Search...", :value="keyword", @input="update_")
      br
      ul.list-group(style="height: 300px; overflow: scroll")
        li.list-group-item(v-for="p in products$search", :class="{'current': p.checked}", @click="toggle(p.id)") {{p.title}}
    div(:class="colCls")
      ul.list-group
        li.list-group-item.list-group-item-primary(v-for="p in products$checked") {{p.title}}
          button.close(type="button", aria-label="Close", @click="toggle(p.id)")
            span(aria-hidden="true") ×
</template>
<script>
  import {mapState} from 'vuex'
  import debounce from 'lodash/debounce'

  export default {
    props: {
      value: {
        required: true
      },
      col: {
        type: Boolean,
        default: false
      },
      single: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        keyword: ''
      }
    },
    computed: {
      ...mapState({
        products: state => state.products.products
      }),
      products$() {
        const self = this;
        return self.products.map(p => ({
          ...p,
          get checked() {
            if (self.single) return self.value * 1 === p.id * 1;
            return self.value.findIndex(id => id * 1 === p.id * 1) >= 0
          }
        }));
      },
      products$search() {
        if (this.keyword === '') return this.products$;
        return this.products$.filter(p => p.title.toLowerCase().includes(this.keyword.toLowerCase()))
      },
      products$checked() {
        return this.products$.filter(p => p.checked)
      },
      colCls() {
        if (this.col) return 'col-sm-6';
        return 'mb-4';
      }
    },
    methods: {
      toggle(_id) {
        const self = this;
        if (self.single) {
          self.$emit('input', _id * 1);
        } else {
          const index = self.value.findIndex(id => id * 1 === _id);
          if (index < 0) self.value.push(_id);
          else {
            self.value.splice(index, 1)
          }
          self.$emit('input', self.value);
        }
      },
      update_: debounce(function ({target}) {
        this.keyword = target.value;
      }, 300)
    }
  }
</script>
