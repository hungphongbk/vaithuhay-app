<style lang="scss" module></style>
<template lang="pug">
  table.table
    thead
      tr
        th(v-for="field in fields" :key="field.key") {{field.label}}
    tbody
      tr(v-for="(item,index) in dataSource$refined" :key="index")
        td(v-for="(value,key) in item" :key="key")
          template(v-if="value.render")
            component(:is="value")
          template(v-else) {{value}}
</template>
<script>
export default {
  name: 'Table',
  props: {
    fields: {
      type: Array,
      required: true
    },
    dataSource: {
      type: Array,
      required: true
    }
  },
  computed: {
    dataSource$refined() {
      return this.dataSource.map(item => {
        const newItem = {}
        this.fields.forEach(({ key, transform }) => {
          if (typeof transform === 'function') {
            newItem[key] = transform(newItem)
            console.log(newItem[key])
          } else newItem[key] = item[key]
        })
        return newItem
      })
    }
  }
}
</script>
