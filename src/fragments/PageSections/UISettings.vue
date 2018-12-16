<style lang="scss" module></style>
<template lang="pug">
  modal(v-if="isShow" title="Thiết lập giao diện" @dismiss="hide")
    .modal-body
      .mb-2
        small <i>Chịu khó sử dụng mã màu nhé, siêng thì mình làm hẳn luôn hộp chọn màu uhuhu... :(</i>
      form
        .form-group.row
          label.col-3 Màu nền
          color-picker(v-model="value.backgroundColor")
        .form-group.row
          label.col-3 Màu chữ
          color-picker(v-model="value.foregroundColor")
</template>
<script>
export default {
  name: 'UISettings',
  components: {
    ColorPicker: {
      functional: true,
      render: (h, { props, listeners }) => {
        const value = props.value || ''
        const appendStyle = {
          width: '8rem',
          backgroundColor: value
        }
        return (
          <div class="col-9">
            <div class="input-group">
              <input
                class="form-control"
                type="text"
                value={value}
                onChange={({ target }) => listeners.input(target.value)}
              />
              <div class="input-group-append">
                <span class="input-group-text" style={appendStyle} />
              </div>
            </div>
          </div>
        )
      }
    }
  },
  props: {
    value: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    isShow: false
  }),
  methods: {
    show() {
      this.isShow = true
    },
    hide() {
      this.isShow = false
    }
  }
}
</script>
