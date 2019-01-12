<style lang="scss" scoped>
@import './header.scss';
</style>
<style lang="scss" module>
.command {
  composes: text-primary from global;
  cursor: pointer;
}
.running {
  composes: text-info from global;
}
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Dashboard
    hr
    .card-columns
      dashboard-section(title="Chạy lệnh")
        command(watch='patchPrice' @click="patchPrice") Đồng bộ lại giá sản phẩm
        command(watch='syncSheet' @click="syncSheet") Đồng bộ đơn hàng (7 ngày gần nhất)
</template>
<script>
import { get, post } from '../plugins/jquery-ajax'
import uuid from 'uuid/v4'
import { SOCKET_EV } from '@universal/consts'
import faPlay from '@fortawesome/fontawesome-free-solid/faPlay'
import faSpin from '@fortawesome/fontawesome-free-solid/faSpinner'

export default {
  name: 'PageDashboard',
  components: {
    DashboardSection: {
      functional: true,
      render(h, { props, children }) {
        return (
          <div class="card">
            <h6 class="card-header">{props.title}</h6>
            <div class="card-body">{children}</div>
          </div>
        )
      }
    },
    Command: {
      functional: true,
      render(h, { parent, props, listeners, children }) {
        const { $style, runningCommands } = parent,
          { watch } = props,
          isRunning = runningCommands[watch],
          classes = {
            [$style.command]: true,
            [$style.running]: isRunning
          }
        return (
          <p class={classes} onClick={listeners.click}>
            {isRunning ? (
              <fa-icon class="mr-2" icon={faSpin} spin />
            ) : (
              <fa-icon class="mr-2" icon={faPlay} />
            )}
            {children}
          </p>
        )
      }
    }
  },
  data() {
    return {
      assetHash: {
        value: null,
        updatedAt: null
      },
      runningCommands: {
        patchPrice: false,
        syncSheet: false
      }
    }
  },
  methods: {
    async fetch() {
      const { value, updated_at } = await get('/meta?key=assetHash&raw=true')
      this.assetHash.value = value
      this.assetHash.updatedAt = updated_at
    },
    async updateHash() {
      const asset = {}
      for (const key of Object.keys(JSON.parse(this.assetHash.value)))
        if (typeof key === 'string') {
          asset[key] = uuid()
        }
      await post('/meta?key=assetHash', asset)
      await this.fetch()
    },
    pushCommand(label, commandName, completedEventName, onComplete = () => {}) {
      this.runningCommands[label] = true
      this.sockets.subscribe(completedEventName, async data => {
        await onComplete(data)
        this.sockets.unsubscribe(completedEventName)
        this.runningCommands[label] = false
      })
      this.$socket.emit(commandName)
    },
    patchPrice() {
      this.pushCommand(
        'patchPrice',
        SOCKET_EV.Util.OnPatchPrice,
        SOCKET_EV.Util.PatchPriceCompleted
      )
    },
    syncSheet() {
      this.$store.dispatch('notifications/pushInfo', {
        title: 'Sync spreadsheet manually',
        metadata: { logs: [] },
        autoRemove: false,
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
          new Promise(resolve => {
            this.sockets.subscribe(SOCKET_EV.Util.SyncSheetProgress, log => {
              noti.updateMeta({
                logs: [...noti.metadata.logs, log]
              })
            })
            this.pushCommand(
              'syncSheet',
              SOCKET_EV.Util.OnSyncSheet,
              SOCKET_EV.Util.SyncSheetCompleted,
              () => {
                noti.changeContextual('success')
                this.sockets.unsubscribe(SOCKET_EV.Util.SyncSheetProgress)
                resolve()
              }
            )
          })
      })
    }
  },
  async mounted() {
    await this.fetch()
  }
}
</script>
