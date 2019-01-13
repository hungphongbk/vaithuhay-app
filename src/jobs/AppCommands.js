import UtilCommands from '@client/jobs/UtilCommands'
import { SOCKET_EV } from '@universal/consts'

class AppCommands extends UtilCommands {
  constructor(context) {
    super(context)
  }

  @UtilCommands.Command([
    SOCKET_EV.Util.UpdateProductJson,
    SOCKET_EV.Util.UpdateProductJsonProgress,
    SOCKET_EV.Util.UpdateProductJsonCompleted
  ])
  updateProductJson() {
    return this.displayNotification('info', {
      title: 'Update product JsonHTML',
      callback: noti =>
        new Promise(resolve => {
          this.on(SOCKET_EV.Util.UpdateProductJsonProgress, log =>
            noti.updateMeta({
              logs: [...noti.metadata.logs, log]
            })
          )
          this.on(SOCKET_EV.Util.UpdateProductJsonCompleted, () => {
            noti.changeContextual('success')
            resolve()
          })
        })
    })
  }

  @UtilCommands.Command([
    SOCKET_EV.Util.UpdateIndexJson,
    SOCKET_EV.Util.UpdateIndexJsonProgress,
    SOCKET_EV.Util.UpdateIndexJsonCompleted
  ])
  updateIndexJson() {
    return this.displayNotification('info', {
      title: 'Update index page JsonHTML',
      callback: noti =>
        new Promise(resolve => {
          this.on(SOCKET_EV.Util.UpdateIndexJsonProgress, log =>
            noti.updateMeta(
              {
                logs: [...noti.metadata.logs, log]
              },
              noti.id
            )
          )
          this.on(SOCKET_EV.Util.UpdateIndexJsonCompleted, () => {
            noti.changeContextual('success')
            resolve()
          })
        })
    })
  }
}

export default AppCommands
