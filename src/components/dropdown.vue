<template lang="pug">
  .dropdown
    button.btn.btn-secondary.dropdown-toggle(type="button", data-toggle="dropdown" aria-haspopup="true" aria-expanded="false")
      i(:class="`fa fa-${icon}`")
      | {{caption}}
    .dropdown-menu(aria-labelledby="dropdownMenuButton")
      a.dropdown-item(v-for="(value,key) in list" :key="key" href="#", @click="$emit('action',key)") {{value}}
</template>
<script>
export default {
  name: 'Dropdown',
  props: {
    caption: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: 'plus'
    },
    list: {
      type: Object,
      required: true
    }
  }
}
</script>
