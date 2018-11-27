import { get, post } from '@client/plugins/jquery-ajax'

class SettingsBase {
  constructor(namespace = 'global') {
    this.namespace = namespace
  }

  async get(key, namespace = 'global') {}

  async set(key, value, namespace = 'global') {}
}

class SettingsServerDB extends SettingsBase {
  async get(key) {
    return await get(`/settings/${this.namespace}/${key}`)
  }

  async set(key, value) {
    return await post(`/settings/${this.namespace}/${key}`, value)
  }
}

class SettingsHaravan extends SettingsBase {}

export default {
  DB: SettingsServerDB,
  Haravan: SettingsHaravan
}
