export default {
  model: {
    prop: 'list'
  },
  props: {
    list: Array,
    new: Function
  },
  data() {
    return {
      mode: 'new',
      current: this.new()
    }
  },
  render(h) {
    return h('div', [
      this.$scopedSlots.default({
        current: this.current,
        mode: this.mode,
        add: this.add,
        update: this.update
      })
    ])
  },
  methods: {
    add() {
      if (this.mode === 'new') {
        this.list.push(this.current);
        this.$emit('input', this.list);
      } else this.mode = 'new';
      this.current = this.new();
    },
    update(item) {
      this.mode = 'edit';
      this.current = item;
    }

  }
}