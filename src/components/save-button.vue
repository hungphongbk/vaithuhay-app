<style lang="scss" scoped>
  .fa {
    margin-right: .3rem;
  }
  .no-icon .fa-floppy-o{
    display: none;
  }
</style>
<template lang="pug">
  //button.btn.btn-success(@click="save", :class="{'btn-lg':lg}")
  wrapper
    transition(name="fade")
      i.fa.fa-ellipsis-h(v-if="saving")
      i.fa.fa-floppy-o(v-else-if="!saved")
      i.fa.fa-check(v-else)
    | {{title}}
</template>
<script>
  export default {
    components: {
      Wrapper: {
        functional: true,
        render(h, {parent, children}) {
          const {type, lg, save} = parent;
          if (type === 'btn') {
            return (<button class="btn btn-success" onClick={save} {...{class: {lg}}}>{children}</button>)
          } else {
            return (<a onClick={save}>{children}</a>)
          }
        }
      }
    },
    props: {
      type: {
        type: String,
        default: 'btn'
      },
      fn: {
        required: true
      },
      title: {
        type: String,
        default: 'Save'
      },
      lg: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        saved: false,
        saving: false,
        error: false
      }
    },
    computed: {
      calcFn() {
        const fn = this.fn;
        if (typeof fn === 'function') return fn;
        const [callee, ...args] = fn;
        return callee.bind(callee, ...args);
      }
    },
    methods: {
      async save() {
        this.saving = true;
        try {
          await this.calcFn();
          this.saving = false;
          this.saved = true;
          setTimeout(() => {
            this.saved = false;
          }, 600);
        } catch (e) {
          this.saving = false;
          this.error = true;
          console.log('[client/save button/error] ' + e.message)
          await this.$store.dispatch('notifications/pushDanger', {
            title: 'Có lỗi xảy ra',
            message: 'Vui lòng liên hệ với Hùng Phong để khắc phục nhé ahihu.'
          });
          setTimeout(() => {
            this.error = false;
          }, 600);
        }
      }
    }
  }
</script>
