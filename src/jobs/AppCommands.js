import UtilCommands from '@client/jobs/UtilCommands'
import { SOCKET_EV } from '@universal/consts'
import { NotificationItem } from '@client/store/notifications'

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
    SOCKET_EV.Util.UpdateProductJsonAll,
    SOCKET_EV.Util.UpdateProductJsonPart,
    SOCKET_EV.Util.UpdateProductJsonProgress,
    SOCKET_EV.Util.UpdateProductJsonCompleted
  ])
  batchUpdateProductJson(total) {
    let counter = 0
    return this.displayNotification('info', {
      title: 'Update product JsonHTML',
      options: {
        withProgress: true
      },
      callback: (noti: NotificationItem) =>
        new Promise(resolve => {
          this.unsubscribe(SOCKET_EV)
          this.on(SOCKET_EV.Util.UpdateProductJsonPart, log => {
            const logs = [...noti.metadata.logs],
              last = logs
                .reverse()
                .slice(0, 5)
                .reverse()
            last.push(log)
            noti.updateMeta({
              logs: last
            })
          })
          this.on(SOCKET_EV.Util.UpdateProductJsonProgress, log =>
            noti.updateMeta({
              logs: [...noti.metadata.logs, log]
            })
          )
          this.on(SOCKET_EV.Util.UpdateProductJsonCompleted, () => {
            if (++counter === total) {
              noti.changeContextual('success')
              resolve()
            } else {
              noti.updateProgress(Math.round((counter * 100) / total))
            }
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
      callback: (noti: NotificationItem) =>
        new Promise(resolve => {
          this.on(SOCKET_EV.Util.UpdateIndexJsonProgress, log =>
            noti.updateMeta({
              logs: [...noti.metadata.logs, log]
            })
          )
          this.on(SOCKET_EV.Util.UpdateIndexJsonCompleted, () => {
            noti.changeContextual('success')
            resolve()
          })
        })
    })
  }

  @UtilCommands.Command([
    SOCKET_EV.GA.UpdateTopProducts,
    SOCKET_EV.GA.UpdateTopProductsProgress,
    SOCKET_EV.GA.UpdateTopProductsCompleted
  ])
  updateTopProducts() {
    return this.displayNotification('info', {
      title: 'Update top products',
      callback: (noti: NotificationItem) =>
        new Promise(resolve => {
          this.on(SOCKET_EV.GA.UpdateTopProductsProgress, log =>
            noti.updateMeta({
              logs: [...noti.metadata.logs, log]
            })
          )
          this.on(SOCKET_EV.GA.UpdateTopProductsCompleted, () => {
            noti.changeContextual('success')
            resolve()
          })
        })
    })
  }
}

export default AppCommands
