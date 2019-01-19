<style lang="scss" module></style>
<template functional lang="pug">
  .progress(:style="{height: `${props.height | 2}px`}")
    .progress-bar(:class="`bg-${props.color}`" role="progressbar" :style="{width: `${props.value}%`, borderRadius: `${(props.height | 2)/2}px`}" :aria-valuenow="props.value" aria-valuemin="0" aria-valuemax="100")
</template>
<script>
export default {
  name: 'ProgressBar'
}
</script>
