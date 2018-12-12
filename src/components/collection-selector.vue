<style lang="scss" module>
.current {
  background: darken(#fff, 5%);
  font-weight: 600;
}
</style>
<template lang="pug">
  div
    ul.list-group(style="height: 300px; overflow:scroll")
      li.list-group-item(v-for="c in categories$" :class="{ [$style.current]: c.checked}" @click="toggle(c.id)") {{c.title}}
</template>
<script>
import searchable from './mixins/searchable'
export default {
  mixins: [
    searchable({
      dataSource: state => state.categories.categories,
      propertyName: 'categories'
    })
  ]
}
</script>
