import request from 'request-promise-native'
import YAML from 'yamljs'

const client = request.defaults({
  baseUrl: 'https://vaithuhay.com'
})

export default async url => {
  try {
    const yaml = await client.get(url)
    return YAML.parse(yaml)
  } catch (e) {
    return null
  }
}
