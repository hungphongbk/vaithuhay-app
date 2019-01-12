class UtilCommands {
  static register(context) {
    return new this(context)
  }

  constructor(context) {
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
  }
  unsubscribes(eventNames) {
    const l = Array.isArray(eventNames) ? eventNames : [eventNames]
    l.forEach(eventName => this.unsubscribe(eventName))
  }

  displayNotification(
    contextual = 'info',
    { title, initialLogs = [], callback, options = {} }
  ) {
    const capitalize = s => s.charAt(0).toUpperCase() + s.substring(1)
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
      callback
    })
  }
}

export default UtilCommands
