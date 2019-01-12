class UtilCommands {
  static register(context) {
    return new this(context)
  }

  constructor(context) {
    this.ctx = context
  }

  subscribe(eventName, callback) {
    this.ctx.sockets.subscribe(eventName, callback)
  }

  unsubscribe(eventName) {
    this.ctx.sockets.unsubscribe(eventName)
  }
  unsubscribes(eventNames) {
    const l = Array.isArray(eventNames) ? eventNames : [eventNames]
    l.forEach(eventName => this.unsubscribe(eventName))
  }

  displayNotification(
    contextual = 'info',
    { title, initialLogs = [], callback }
  ) {
    const capitalize = s => s.charAt(0).toUpperCase() + s.substring(1)
    this.ctx.$store.dispatch(`notifications/push${capitalize(contextual)}`, {
      title,
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
