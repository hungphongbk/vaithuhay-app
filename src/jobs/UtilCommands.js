import EventEmitter from 'events'
import { NotificationItem } from '@client/store/notifications'

let _resolve

class UtilCommands extends EventEmitter {
  static ctx
  static ctxPromise = new Promise(resolve => {
    _resolve = resolve
  })
  static register(context) {
    let root = context.$root
    if (!this.ctx) {
      this.ctx = new this(root)
      _resolve(this.ctx)
    }

    return this.ctx
  }
  static Command(eventNames) {
    const self = this,
      [eventName, ...rest] = eventNames
    return (target, name, descriptor) => {
      self.ctxPromise.then(ctx => {
        const value = descriptor.value,
          callback = args => {
            rest.forEach(ev => ctx.subscribe(ev, data => ctx.emit(ev, data)))
            const promise = value.call(ctx, args)
            return promise.then(() => ctx.unsubscribes(rest))
          }

        ctx.subscribe(eventName, callback)
      })
      return null
    }
  }

  constructor(context) {
    super()
    this.ctx = context
    this.events = {}
  }

  subscribe(eventName, callback) {
    if (this.events[eventName]) return
    this.events[eventName] = true
    this.ctx.sockets.subscribe(eventName, callback)
  }

  unsubscribe(eventName) {
    delete this.events[eventName]
    this.ctx.sockets.unsubscribe(eventName)
    this.removeAllListeners(eventName)
  }
  unsubscribes(eventNames) {
    const l = Array.isArray(eventNames) ? eventNames : [eventNames]
    l.forEach(eventName => this.unsubscribe(eventName))
  }

  socketEmit(eventName, data = null) {
    const sockets = this.ctx.$socket
    if (data) sockets.emit(eventName, data)
    else sockets.emit(eventName)
  }

  displayNotification(
    contextual = 'info',
    {
      title,
      initialLogs = [],
      callback,
      options = {}
    }: {
      title: string,
      initialLogs: Array<string>,
      callback: NotificationItem => Promise<void>,
      options: any
    }
  ) {
    const capitalize = s => s.charAt(0).toUpperCase() + s.substring(1)
    return new Promise((resolve, reject) => {
      this.ctx.$store.dispatch(`notifications/push${capitalize(contextual)}`, {
        title,
        ...options,
        metadata: { logs: initialLogs },
        message: {
          functional: true,
          render(h, { props }) {
            return (
              <div>
                {props.metadata.logs.map(log => (
                  <p class="mb-1">{log}</p>
                ))}
              </div>
            )
          }
        },
        callback: noti =>
          callback(noti)
            .then(resolve)
            .catch(reject)
      })
    })
  }
}

export default UtilCommands
