import Vue from 'vue'
import Modal from '@client/components/modal.vue'

const $ev = new Vue()

export default {
  data: () => ({
    modal: {
      title: '',
      body: null
    }
  }),
  render(h) {
    if (!this.modal) return <div />
    const modal = this.modal,
      ModalBody = modal.body,
      on = {
        'modal-dismiss': () => {
          this.modal = null
        }
      }
    return (
      <Modal title={modal.title} dismissable={modal.dismissable || false}>
        <ModalBody {...{ on }} />
      </Modal>
    )
  },
  created() {
    this.modal = null
    $ev.$on('modal', data => {
      this.modal = data
    })
  }
}

export const ModalManager = data => $ev.$emit('modal', data)
