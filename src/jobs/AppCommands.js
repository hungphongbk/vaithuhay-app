import UtilCommands from '@client/jobs/UtilCommands'
import { SOCKET_EV } from '@universal/consts'

class AppCommands extends UtilCommands {
  constructor(context) {
    super(context)
    this.updateProductJson()
    this.updateIndexJson()
  }

  updateProductJson() {
    this.subscribe(SOCKET_EV.Util.UpdateProductJson, () => {
      this.displayNotification('info', {
        title: 'Update product JsonHTML',
        options: { autoRemove: false },
        callback: noti =>
          new Promise(resolve => {
            this.subscribe(SOCKET_EV.Util.UpdateProductJsonProgress, log =>
              noti.updateMeta({
                logs: [...noti.metadata.logs, log]
              })
            )
            this.subscribe(SOCKET_EV.Util.UpdateProductJsonCompleted, () => {
              noti.changeContextual('success')
              this.unsubscribes([
                SOCKET_EV.Util.UpdateProductJsonProgress,
                SOCKET_EV.Util.UpdateProductJsonCompleted
              ])
              resolve()
            })
          })
      })
    })
  }

  updateIndexJson() {
    this.subscribe(SOCKET_EV.Util.UpdateIndexJson, () => {
      this.displayNotification('info', {
        title: 'Update index page JsonHTML',
        options: { autoRemove: false },
        callback: noti =>
          new Promise(resolve => {
            this.subscribe(SOCKET_EV.Util.UpdateIndexJsonProgress, log =>
              noti.updateMeta({
                logs: [...noti.metadata.logs, log]
              })
            )
            this.subscribe(SOCKET_EV.Util.UpdateIndexJsonCompleted, () => {
              noti.changeContextual('success')
              this.unsubscribes([
                SOCKET_EV.Util.UpdateIndexJsonProgress,
                SOCKET_EV.Util.UpdateIndexJsonCompleted
              ])
              resolve()
            })
          })
      })
    })
  }
}

export default AppCommands
