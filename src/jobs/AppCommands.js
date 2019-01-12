import UtilCommands from '@client/jobs/UtilCommands'
import { SOCKET_EV } from '@universal/consts'

class AppCommands extends UtilCommands {
  constructor(context) {
    super(context)
    this.updateProductJson()
  }

  updateProductJson() {
    this.subscribe(SOCKET_EV.Util.UpdateProductJson, () => {
      console.log(this.ctx)
      this.displayNotification('info', {
        title: 'Update product JsonHTML',
        callback: noti =>
          new Promise(resolve => {
            this.subscribe(SOCKET_EV.Util.UpdateProductJsonProgress, log =>
              noti.updateMeta({
                logs: [...noti.metadata.logs, log]
              })
            )
            this.subscribe(SOCKET_EV.Util.UpdateProductJsonCompleted, () => {
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
}

export default AppCommands
