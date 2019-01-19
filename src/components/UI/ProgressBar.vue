<style lang="scss" module></style>
<template functional lang="pug">
  .progress(:style="{height: `${props.height | 1}px`}")
    .progress-bar(role="progressbar" :style="{width: `${props.value}%`}" :aria-valuenow="props.value" aria-valuemin="0" aria-valuemax="100")
</template>
<script>
export default {
  name: 'ProgressBar'
}
</script>
