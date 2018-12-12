<template lang="pug">
  div.media
    img.mr-3(src="../../images/icon-banner.png")
    .media-body
      h6.card-title.mb-1 Banner
</template>
<script>
export default {
  mounted() {
    this.$emit('update', { version: 1 })
  }
}
</script>
